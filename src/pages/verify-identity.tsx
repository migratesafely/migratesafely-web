import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MainHeader } from "@/components/MainHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [existingVerification, setExistingVerification] = useState<any>(null);
  
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idType, setIdType] = useState("");
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  async function checkAccessAndLoadData() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!membership || membership.status !== "active") {
        setErrorMessage("Active membership required to verify identity");
        setLoading(false);
        return;
      }

      setHasActiveMembership(true);

      const { data: verification } = await supabase
        .from("identity_verifications")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (verification) {
        setExistingVerification(verification);
        setTitle(verification.title);
        setFirstName(verification.first_name);
        setMiddleName(verification.middle_name || "");
        setLastName(verification.last_name);
        setDateOfBirth(verification.date_of_birth);
        setNationality(verification.nationality);
        setIdNumber(verification.id_number);
        setIdType(verification.id_type);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setErrorMessage("Failed to load verification data");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File, type: string): Promise<string | null> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return null;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("identity-docs")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("identity-docs")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title || !firstName || !lastName || !dateOfBirth || !nationality || !idNumber || !idType) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    if (!existingVerification && !idFrontFile) {
      setErrorMessage("Please upload ID front photo");
      return;
    }

    if (existingVerification && existingVerification.status === "APPROVED") {
      setErrorMessage("Your identity is already verified");
      return;
    }

    setSubmitting(true);

    try {
      let idFrontUrl = existingVerification?.id_front_url || "";
      let idBackUrl = existingVerification?.id_back_url || "";
      let selfieUrl = existingVerification?.selfie_url || "";

      if (idFrontFile) {
        setUploadingId("front");
        const url = await handleFileUpload(idFrontFile, "id_front");
        if (!url) throw new Error("Failed to upload ID front");
        idFrontUrl = url;
      }

      if (idBackFile) {
        setUploadingId("back");
        const url = await handleFileUpload(idBackFile, "id_back");
        if (url) idBackUrl = url;
      }

      if (selfieFile) {
        setUploadingId("selfie");
        const url = await handleFileUpload(selfieFile, "selfie");
        if (url) selfieUrl = url;
      }

      setUploadingId(null);

      const response = await fetch("/api/identity/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          nationality,
          idNumber,
          idType,
          idFrontUrl,
          idBackUrl,
          selfieUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Identity verification submitted successfully! Please wait for admin review.");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setErrorMessage(data.error || "Failed to submit verification");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setErrorMessage("Failed to submit verification");
    } finally {
      setSubmitting(false);
      setUploadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!hasActiveMembership) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertDescription>Active membership required to verify identity</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Verify Identity - MigrateSafely"
        description="Verify an identity document or user"
      />
      <MainHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Identity Verification</h1>
              <p className="text-muted-foreground mt-2">
                Verify your identity to unlock prize claims and wallet withdrawals
              </p>
            </div>

            {existingVerification && (
              <Alert>
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Status:{" "}
                    <Badge
                      variant={
                        existingVerification.status === "APPROVED"
                          ? "default"
                          : existingVerification.status === "REJECTED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {existingVerification.status}
                    </Badge>
                  </span>
                  {existingVerification.status === "APPROVED" && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {existingVerification.status === "REJECTED" && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </AlertDescription>
              </Alert>
            )}

            {existingVerification?.rejection_reason && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Rejection Reason:</strong> {existingVerification.rejection_reason}
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Provide your official identity details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <Label htmlFor="title">Title *</Label>
                      <Select value={title} onValueChange={setTitle} disabled={existingVerification?.status === "APPROVED"}>
                        <SelectTrigger id="title">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">Mr</SelectItem>
                          <SelectItem value="mrs">Mrs</SelectItem>
                          <SelectItem value="miss">Miss</SelectItem>
                          <SelectItem value="dr">Dr</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={existingVerification?.status === "APPROVED"}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      disabled={existingVerification?.status === "APPROVED"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={existingVerification?.status === "APPROVED"}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      disabled={existingVerification?.status === "APPROVED"}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      disabled={existingVerification?.status === "APPROVED"}
                      placeholder="e.g., Bangladeshi"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="idType">ID Type *</Label>
                    <Select value={idType} onValueChange={setIdType} disabled={existingVerification?.status === "APPROVED"}>
                      <SelectTrigger id="idType">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                      id="idNumber"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      disabled={existingVerification?.status === "APPROVED"}
                      required
                    />
                  </div>

                  {existingVerification?.status !== "APPROVED" && (
                    <>
                      <div>
                        <Label htmlFor="idFront">ID Front Photo * {uploadingId === "front" && <Loader2 className="inline h-4 w-4 animate-spin" />}</Label>
                        <Input
                          id="idFront"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                          disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Upload clear photo of ID front side</p>
                      </div>

                      <div>
                        <Label htmlFor="idBack">ID Back Photo {uploadingId === "back" && <Loader2 className="inline h-4 w-4 animate-spin" />}</Label>
                        <Input
                          id="idBack"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                          disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Upload clear photo of ID back side (if applicable)</p>
                      </div>

                      <div>
                        <Label htmlFor="selfie">Selfie Photo {uploadingId === "selfie" && <Loader2 className="inline h-4 w-4 animate-spin" />}</Label>
                        <Input
                          id="selfie"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                          disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Upload a clear selfie holding your ID (optional but recommended)</p>
                      </div>
                    </>
                  )}

                  {existingVerification?.status !== "APPROVED" && (
                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {uploadingId ? `Uploading ${uploadingId}...` : "Submitting..."}
                        </>
                      ) : existingVerification ? (
                        "Update Verification"
                      ) : (
                        "Submit Verification"
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <PublicFooter />
      </div>
    </>
  );
}