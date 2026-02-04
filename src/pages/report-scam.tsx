import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Upload, X, User } from "lucide-react";
import { MainHeader } from "@/components/MainHeader";

export default function ReportScam() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    scammerName: "",
    scammerCompany: "",
    scammerContact: "",
    description: "",
    amountLost: "",
    currency: "BDT",
    incidentDate: "",
    lastKnownAddress: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [scammerPhoto, setScammerPhoto] = useState<File | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data: membership } = await supabase
        .from("memberships")
        .select("status, end_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!membership || membership.status !== "active" || 
          (membership.end_date && new Date(membership.end_date) < new Date())) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error("Access check error:", err);
      router.push("/dashboard");
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  function handleScammerPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setScammerPhoto(e.target.files[0]);
    }
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  function removeScammerPhoto() {
    setScammerPhoto(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (files.length === 0) {
        setError("Please upload at least one evidence file");
        setSubmitting(false);
        return;
      }

      const formDataObj = new FormData();
      files.forEach((file) => {
        formDataObj.append("files", file);
      });

      if (scammerPhoto) {
        formDataObj.append("scammerPhoto", scammerPhoto);
      }

      const uploadRes = await fetch("/api/scam-reports/upload-evidence", {
        method: "POST",
        body: formDataObj,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload evidence files");
      }

      const { urls, scammerPhotoUrl } = await uploadRes.json();

      const submitRes = await fetch("/api/scam-reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scammerName: formData.scammerName,
          scammerCompany: formData.scammerCompany || null,
          scammerContact: formData.scammerContact || null,
          description: formData.description,
          amountLost: formData.amountLost ? parseFloat(formData.amountLost) : null,
          currency: formData.currency || null,
          incidentDate: formData.incidentDate || null,
          evidenceFileUrls: urls,
          scammerPhotoUrl: scammerPhotoUrl || null,
          lastKnownAddress: formData.lastKnownAddress || null,
        }),
      });

      if (!submitRes.ok) {
        throw new Error("Failed to submit scam report");
      }

      setSuccess(true);
      setFormData({
        scammerName: "",
        scammerCompany: "",
        scammerContact: "",
        description: "",
        amountLost: "",
        currency: "BDT",
        incidentDate: "",
        lastKnownAddress: "",
      });
      setFiles([]);
      setScammerPhoto(null);

      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainHeader />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Report a Scammer</CardTitle>
            <CardDescription>
              Submit evidence of scam activity for admin verification and review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Report submitted successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="scammerName">Scammer Name *</Label>
                <Input
                  id="scammerName"
                  name="scammerName"
                  value={formData.scammerName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter scammer's name"
                />
              </div>

              <div>
                <Label htmlFor="scammerCompany">Company (Optional)</Label>
                <Input
                  id="scammerCompany"
                  name="scammerCompany"
                  value={formData.scammerCompany}
                  onChange={handleInputChange}
                  placeholder="Company or organization name"
                />
              </div>

              <div>
                <Label htmlFor="scammerContact">Contact Details</Label>
                <Input
                  id="scammerContact"
                  name="scammerContact"
                  value={formData.scammerContact}
                  onChange={handleInputChange}
                  placeholder="Phone, email, or website"
                />
              </div>

              <div>
                <Label htmlFor="scammerPhoto">Scammer Photo (Optional)</Label>
                <div className="mt-2">
                  <label
                    htmlFor="scammerPhoto"
                    className="flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="text-center">
                      <User className="mx-auto h-6 w-6 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-600">
                        Click to upload scammer photo
                      </p>
                      <p className="text-xs text-gray-500">
                        Photo or screenshot of the scammer (single image)
                      </p>
                    </div>
                    <input
                      id="scammerPhoto"
                      type="file"
                      onChange={handleScammerPhotoChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                </div>

                {scammerPhoto && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-sm text-blue-700 truncate flex-1">
                        {scammerPhoto.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeScammerPhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="lastKnownAddress">Last Known Address / Location (Optional)</Label>
                <Textarea
                  id="lastKnownAddress"
                  name="lastKnownAddress"
                  value={formData.lastKnownAddress}
                  onChange={handleInputChange}
                  placeholder="Last known physical address, city, or location of the scammer..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe the scam incident in detail..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amountLost">Amount Lost (Optional)</Label>
                  <Input
                    id="amountLost"
                    name="amountLost"
                    type="number"
                    step="0.01"
                    value={formData.amountLost}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    placeholder="BDT, USD, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="incidentDate">Incident Date (Optional)</Label>
                <Input
                  id="incidentDate"
                  name="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="evidence">Evidence Files *</Label>
                <div className="mt-2">
                  <label
                    htmlFor="evidence"
                    className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Click to upload evidence files
                      </p>
                      <p className="text-xs text-gray-500">
                        Screenshots, documents, photos (multiple files allowed)
                      </p>
                    </div>
                    <input
                      id="evidence"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={submitting || success}
                  className="flex-1"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}