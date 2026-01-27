import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import formidable from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check membership status
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("membership_number, status")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership || membership.status !== "active") {
      return res.status(403).json({ error: "Active membership required" });
    }

    // Check annual submission limit (max 3 per year)
    const currentYear = new Date().getFullYear();
    const { count } = await supabase
      .from("agent_verification_requests")
      .select("*", { count: "exact", head: true })
      .eq("member_id", user.id)
      .gte("created_at", `${currentYear}-01-01`);

    if (count && count >= 3) {
      return res.status(429).json({ 
        error: "Maximum 3 verification requests per year" 
      });
    }

    // Parse form data
    const form = formidable({
      maxFiles: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowEmptyFiles: false,
    });

    const [fields, files] = await form.parse(req);

    // Extract form fields
    const agentName = Array.isArray(fields.agentName) ? fields.agentName[0] : fields.agentName;
    const companyName = Array.isArray(fields.companyName) ? fields.companyName[0] : fields.companyName;
    const phoneNumber = Array.isArray(fields.phoneNumber) ? fields.phoneNumber[0] : fields.phoneNumber;
    const whatsappNumber = Array.isArray(fields.whatsappNumber) ? fields.whatsappNumber[0] : fields.whatsappNumber;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const websiteOrSocial = Array.isArray(fields.websiteOrSocial) ? fields.websiteOrSocial[0] : fields.websiteOrSocial;
    const agentCountry = Array.isArray(fields.agentCountry) ? fields.agentCountry[0] : fields.agentCountry;
    const contactMethod = Array.isArray(fields.contactMethod) ? fields.contactMethod[0] : fields.contactMethod;
    const servicesStr = Array.isArray(fields.services) ? fields.services[0] : fields.services;
    const services = servicesStr ? JSON.parse(servicesStr) : [];
    const additionalDetails = Array.isArray(fields.additionalDetails) ? fields.additionalDetails[0] : fields.additionalDetails;

    const askedUpfrontPayment = (Array.isArray(fields.askedUpfrontPayment) ? fields.askedUpfrontPayment[0] : fields.askedUpfrontPayment) === "true";
    const promisedGuarantee = (Array.isArray(fields.promisedGuarantee) ? fields.promisedGuarantee[0] : fields.promisedGuarantee) === "true";
    const askedDocumentsEarly = (Array.isArray(fields.askedDocumentsEarly) ? fields.askedDocumentsEarly[0] : fields.askedDocumentsEarly) === "true";
    const refusedLicense = (Array.isArray(fields.refusedLicense) ? fields.refusedLicense[0] : fields.refusedLicense) === "true";
    const privateCommOnly = (Array.isArray(fields.privateCommOnly) ? fields.privateCommOnly[0] : fields.privateCommOnly) === "true";

    // Validate required fields
    if (!agentName || !phoneNumber || !agentCountry || !contactMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Handle file uploads to Supabase Storage
    const evidenceFiles: any[] = [];
    if (files.files) {
      const fileArray = Array.isArray(files.files) ? files.files : [files.files];
      
      for (const file of fileArray) {
        const fileBuffer = await fs.readFile(file.filepath);
        const fileName = `${user.id}/${Date.now()}-${file.originalFilename}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("verification-evidence")
          .upload(fileName, fileBuffer, {
            contentType: file.mimetype || "application/octet-stream",
          });

        if (uploadError) {
          console.error("File upload error:", uploadError);
          continue;
        }

        evidenceFiles.push({
          name: file.originalFilename,
          path: uploadData.path,
          size: file.size,
          type: file.mimetype,
        });

        // Clean up temp file
        await fs.unlink(file.filepath).catch(() => {});
      }
    }

    // Insert verification request
    const { data: request, error: insertError } = await supabase
      .from("agent_verification_requests")
      .insert({
        member_id: user.id,
        membership_number: membership.membership_number,
        agent_name: agentName,
        company_name: companyName || null,
        phone_number: phoneNumber,
        whatsapp_number: whatsappNumber || null,
        email: email || null,
        website_or_social: websiteOrSocial || null,
        agent_country: agentCountry,
        contact_method: contactMethod,
        services: services,
        asked_upfront_payment: askedUpfrontPayment,
        promised_guarantee: promisedGuarantee,
        asked_documents_early: askedDocumentsEarly,
        refused_license: refusedLicense,
        private_comm_only: privateCommOnly,
        additional_details: additionalDetails || null,
        evidence_files: evidenceFiles,
        status: "pending",
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ error: "Failed to submit verification request" });
    }

    // Send notification to admin team
    await supabase
      .from("messages")
      .insert({
        sender_user_id: user.id,
        recipient_role: "ADMIN",
        subject: `New Agent Verification Request - ${agentName}`,
        body: `A member has submitted a new agent verification request.\n\nAgent: ${agentName}\nMembership: ${membership.membership_number}\n\nPlease review in the admin panel.`,
        sender_role: "MEMBER",
      } as any);

    return res.status(200).json({ 
      success: true,
      requestId: request.id 
    });
  } catch (error: any) {
    console.error("Submission error:", error);
    return res.status(500).json({ 
      error: "Failed to submit verification request" 
    });
  }
}