import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import formidable, { File as FormidableFile } from "formidable";
import { createReadStream } from "fs";
import nodemailer from "nodemailer";

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedForm {
  fields: formidable.Fields;
  files: formidable.Files;
}

const parseForm = (req: NextApiRequest): Promise<ParsedForm> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Parse form data
    const { fields, files } = await parseForm(req);

    // Extract fields
    const membershipNumber = Array.isArray(fields.membershipNumber) 
      ? fields.membershipNumber[0] 
      : fields.membershipNumber;
    const fullName = Array.isArray(fields.fullName) 
      ? fields.fullName[0] 
      : fields.fullName;
    const email = Array.isArray(fields.email) 
      ? fields.email[0] 
      : fields.email;
    const country = Array.isArray(fields.country) 
      ? fields.country[0] 
      : fields.country;
    const personalBackground = Array.isArray(fields.personalBackground) 
      ? fields.personalBackground[0] 
      : fields.personalBackground;
    const hardshipExplanation = Array.isArray(fields.hardshipExplanation) 
      ? fields.hardshipExplanation[0] 
      : fields.hardshipExplanation;
    const scamDeclaration = Array.isArray(fields.scamDeclaration) 
      ? fields.scamDeclaration[0] 
      : fields.scamDeclaration;
    const scamDetails = Array.isArray(fields.scamDetails) 
      ? fields.scamDetails[0] 
      : fields.scamDetails;

    // Validate required fields
    if (!personalBackground || !hardshipExplanation || !scamDeclaration) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check submission limit (one per year)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("last_hardship_request_year")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: "Failed to verify submission eligibility" });
    }

    const currentYear = new Date().getFullYear();
    if (profile.last_hardship_request_year === currentYear) {
      return res.status(400).json({ 
        error: "You have already submitted a hardship request this year" 
      });
    }

    // Prepare email attachments
    const attachments: Array<{
      filename: string;
      path: string;
    }> = [];

    for (let i = 0; i < 3; i++) {
      const fileKey = `file${i}`;
      const file = files[fileKey];
      
      if (file) {
        const fileData = Array.isArray(file) ? file[0] : file;
        if (fileData && "filepath" in fileData) {
          attachments.push({
            filename: fileData.originalFilename || `attachment${i + 1}`,
            path: fileData.filepath,
          });
        }
      }
    }

    // Create email transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Build email content
    const submissionDate = new Date().toISOString().split("T")[0];
    
    let emailBody = `
Community Hardship Draw Request

Membership Number: ${membershipNumber}
Full Name: ${fullName}
Email: ${email}
Country: ${country}
Submission Date: ${submissionDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONAL BACKGROUND:
${personalBackground}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HARDSHIP EXPLANATION:
${hardshipExplanation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCAM DECLARATION: ${scamDeclaration === "yes" ? "YES" : "NO"}
`;

    if (scamDeclaration === "yes" && scamDetails) {
      emailBody += `
SCAM DETAILS & IMPACT:
${scamDetails}
`;
    }

    if (attachments.length > 0) {
      emailBody += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATTACHED EVIDENCE: ${attachments.length} file(s)
`;
    }

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: "hardshipdraw@migratesafely.com",
      subject: `Community Hardship Draw Request – Membership #${membershipNumber}`,
      text: emailBody,
      attachments: attachments,
    });

    // Update last submission year
    await supabase
      .from("profiles")
      .update({ last_hardship_request_year: currentYear })
      .eq("id", user.id);

    return res.status(200).json({ 
      success: true,
      message: "Hardship request submitted successfully" 
    });

  } catch (error) {
    console.error("Error processing hardship request:", error);
    return res.status(500).json({ 
      error: "Failed to submit hardship request" 
    });
  }
}