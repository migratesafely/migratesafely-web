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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "Failed to parse form data" });
      }

      const uploadedUrls: string[] = [];
      let scammerPhotoUrl: string | undefined;

      // Handle evidence files (multiple)
      const fileArray = Array.isArray(files.files) ? files.files : files.files ? [files.files] : [];

      for (const file of fileArray) {
        if (!file) continue;

        try {
          const fileContent = await fs.readFile(file.filepath);
          const fileExt = file.originalFilename?.split(".").pop() || "jpg";
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data, error: uploadError } = await supabase.storage
            .from("scam-evidence")
            .upload(fileName, fileContent, {
              contentType: file.mimetype || "application/octet-stream",
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("scam-evidence")
            .getPublicUrl(data.path);

          uploadedUrls.push(publicUrlData.publicUrl);

          await fs.unlink(file.filepath);
        } catch (fileError) {
          console.error("File processing error:", fileError);
        }
      }

      // Handle optional scammer photo (single file)
      const scammerPhotoFile = Array.isArray(files.scammerPhoto) 
        ? files.scammerPhoto[0] 
        : files.scammerPhoto;

      if (scammerPhotoFile) {
        try {
          const fileContent = await fs.readFile(scammerPhotoFile.filepath);
          const fileExt = scammerPhotoFile.originalFilename?.split(".").pop() || "jpg";
          const fileName = `${user.id}/scammer-photo/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data, error: uploadError } = await supabase.storage
            .from("scam-evidence")
            .upload(fileName, fileContent, {
              contentType: scammerPhotoFile.mimetype || "image/jpeg",
              cacheControl: "3600",
              upsert: false,
            });

          if (!uploadError && data) {
            const { data: publicUrlData } = supabase.storage
              .from("scam-evidence")
              .getPublicUrl(data.path);

            scammerPhotoUrl = publicUrlData.publicUrl;
          } else {
            console.error("Scammer photo upload error:", uploadError);
          }

          await fs.unlink(scammerPhotoFile.filepath);
        } catch (photoError) {
          console.error("Scammer photo processing error:", photoError);
        }
      }

      if (uploadedUrls.length === 0 && !scammerPhotoUrl) {
        return res.status(500).json({ error: "Failed to upload any files" });
      }

      return res.status(200).json({ 
        urls: uploadedUrls,
        scammerPhotoUrl 
      });
    });
  } catch (error) {
    console.error("Upload evidence API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}