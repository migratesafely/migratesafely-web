import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Upload, X, CheckCircle, FileText, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicPageTeaser } from "@/components/PublicPageTeaser";

interface MemberData {
  membershipNumber: string;
  fullName: string;
  email: string;
  country: string;
  membershipStatus: string;
}

export default function CommunityHardshipRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [canSubmit, setCanSubmit] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Form fields
  const [personalBackground, setPersonalBackground] = useState("");
  const [hardshipExplanation, setHardshipExplanation] = useState("");
  const [scamDeclaration, setScamDeclaration] = useState<"yes" | "no" | "">("");
  const [scamDetails, setScamDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Get member profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, country_code, last_hardship_request_year")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setGeneralError("Unable to load member data");
        setLoading(false);
        return;
      }

      // Get membership status
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("membership_number, status")
        .eq("user_id", user.id)
        .single();

      // Check if membership exists and is active
      if (membershipError && membershipError.code !== "PGRST116") {
        console.error("Membership error:", membershipError);
      }

      const membershipStatus = membership?.status || "inactive";
      const membershipNumber = membership?.membership_number?.toString() || "N/A";

      if (membershipStatus !== "active") {
        setGeneralError("Community Hardship Draw Request is only available to members with active membership");
        setLoading(false);
        return;
      }

      setMemberData({
        membershipNumber: membershipNumber,
        fullName: profile.full_name || "N/A",
        email: user.email || "N/A",
        country: profile.country_code || "N/A",
        membershipStatus: membershipStatus
      });

      // Check if already submitted this year
      const currentYear = new Date().getFullYear();
      if (profile.last_hardship_request_year === currentYear) {
        setCanSubmit(false);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setGeneralError("An error occurred while loading your data");
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setUploadingFiles(true);
    const newFiles = Array.from(e.target.files);
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};

    // Validate each file
    for (const file of newFiles) {
      // Check file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        newErrors.files = "Only PDF, JPG, and PNG files are allowed";
        continue;
      }

      // Check file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        newErrors.files = `File "${file.name}" exceeds 10MB limit`;
        continue;
      }

      validFiles.push(file);
    }

    // Check total file count
    if (files.length + validFiles.length > 3) {
      newErrors.files = "Maximum 3 files allowed";
      setErrors(prev => ({ ...prev, ...newErrors }));
      setUploadingFiles(false);
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => {
      const { files: _, ...rest } = prev;
      return rest;
    });

    // Simulate upload delay for better UX
    setTimeout(() => {
      setUploadingFiles(false);
    }, 300);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!personalBackground.trim()) {
      newErrors.personalBackground = "Please tell us about yourself";
    }

    if (!hardshipExplanation.trim()) {
      newErrors.hardshipExplanation = "Please explain your hardship situation";
    }

    if (!scamDeclaration) {
      newErrors.scamDeclaration = "Please indicate if you were affected by a scam";
    }

    if (scamDeclaration === "yes" && !scamDetails.trim()) {
      newErrors.scamDetails = "Please describe the scam and its impact";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setGeneralError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      
      // Add form fields
      formData.append("membershipNumber", memberData!.membershipNumber);
      formData.append("fullName", memberData!.fullName);
      formData.append("email", memberData!.email);
      formData.append("country", memberData!.country);
      formData.append("personalBackground", personalBackground);
      formData.append("hardshipExplanation", hardshipExplanation);
      formData.append("scamDeclaration", scamDeclaration);
      if (scamDeclaration === "yes") {
        formData.append("scamDetails", scamDetails);
      }

      // Add files
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const response = await fetch("/api/hardship-request/submit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit request");
      }

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting request:", error);
      setGeneralError(error instanceof Error ? error.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (ext === "jpg" || ext === "jpeg" || ext === "png") return "🖼️";
    return "📎";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <SEO title="Community Hardship Draw Request" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (generalError && !memberData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <SEO title="Community Hardship Draw Request" />
        <div className="flex items-center justify-center min-h-screen px-4">
          <Alert className="max-w-md animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <SEO title="Request Submitted" />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center animate-scale-in">
            <div className="mb-6 animate-bounce-once">
              <CheckCircle className="h-20 w-20 text-green-600 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Request Submitted Successfully
            </h1>
            <div className="space-y-4 text-left bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Your hardship request has been sent successfully.</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>All submissions are reviewed fairly by our community support team.</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Due to volume, individual responses are not guaranteed.</span>
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <SEO title="Community Hardship Draw Request" />
      
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Community Hardship Draw Request
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Submit your request for consideration under the Community Hardship Draw
            </p>
          </div>

          {/* Member-Only Teaser */}
          <div className="mb-8">
            <PublicPageTeaser showCTA={true} />
          </div>

          {!canSubmit && (
            <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-900/20 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                You may submit one hardship request per calendar year. You have already submitted a request this year.
              </AlertDescription>
            </Alert>
          )}

          {generalError && (
            <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700 dark:text-red-400">
                {generalError}
              </AlertDescription>
            </Alert>
          )}

          {canSubmit && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Auto-filled member data */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-lg space-y-3 border border-gray-200 dark:border-gray-600">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Member Information (Auto-filled)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Membership Number</Label>
                    <p className="font-medium text-gray-900 dark:text-white">{memberData?.membershipNumber}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name</Label>
                    <p className="font-medium text-gray-900 dark:text-white">{memberData?.fullName}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</Label>
                    <p className="font-medium text-gray-900 dark:text-white">{memberData?.email}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Country</Label>
                    <p className="font-medium text-gray-900 dark:text-white">{memberData?.country}</p>
                  </div>
                </div>
              </div>

              {/* Personal Background */}
              <div className="transition-all duration-200 hover:translate-x-1">
                <Label htmlFor="personalBackground" className="required text-base">
                  Personal Background
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Tell us briefly about yourself
                </p>
                <Textarea
                  id="personalBackground"
                  value={personalBackground}
                  onChange={(e) => setPersonalBackground(e.target.value)}
                  placeholder="Share your background, family situation, work history, etc."
                  rows={4}
                  className={`transition-all duration-200 ${errors.personalBackground ? "border-red-500 animate-shake" : "focus:border-blue-500"}`}
                />
                {errors.personalBackground && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="h-3 w-3" />
                    {errors.personalBackground}
                  </p>
                )}
              </div>

              {/* Hardship Explanation */}
              <div className="transition-all duration-200 hover:translate-x-1">
                <Label htmlFor="hardshipExplanation" className="required text-base">
                  Hardship Explanation
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Explain your current hardship situation
                </p>
                <Textarea
                  id="hardshipExplanation"
                  value={hardshipExplanation}
                  onChange={(e) => setHardshipExplanation(e.target.value)}
                  placeholder="Describe the challenges you are facing and how they impact you and your family"
                  rows={5}
                  className={`transition-all duration-200 ${errors.hardshipExplanation ? "border-red-500 animate-shake" : "focus:border-blue-500"}`}
                />
                {errors.hardshipExplanation && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="h-3 w-3" />
                    {errors.hardshipExplanation}
                  </p>
                )}
              </div>

              {/* Scam Declaration */}
              <div className="transition-all duration-200 hover:translate-x-1">
                <Label className="required text-base">Were you affected by a scam?</Label>
                <RadioGroup
                  value={scamDeclaration}
                  onValueChange={(value) => setScamDeclaration(value as "yes" | "no")}
                  className="mt-3 space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
                    <RadioGroupItem value="yes" id="scam-yes" />
                    <Label htmlFor="scam-yes" className="font-normal cursor-pointer flex-1">
                      Yes, I was affected by a scam
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
                    <RadioGroupItem value="no" id="scam-no" />
                    <Label htmlFor="scam-no" className="font-normal cursor-pointer flex-1">
                      No, I was not affected by a scam
                    </Label>
                  </div>
                </RadioGroup>
                {errors.scamDeclaration && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="h-3 w-3" />
                    {errors.scamDeclaration}
                  </p>
                )}
              </div>

              {/* Scam Details (conditional) */}
              {scamDeclaration === "yes" && (
                <div className="transition-all duration-200 hover:translate-x-1 animate-fade-in-up">
                  <Label htmlFor="scamDetails" className="required text-base">
                    Scam Details and Impact
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Describe the scam and how it affected you
                  </p>
                  <Textarea
                    id="scamDetails"
                    value={scamDetails}
                    onChange={(e) => setScamDetails(e.target.value)}
                    placeholder="Provide details about the scam, when it occurred, and its impact on your situation"
                    rows={4}
                    className={`transition-all duration-200 ${errors.scamDetails ? "border-red-500 animate-shake" : "focus:border-blue-500"}`}
                  />
                  {errors.scamDetails && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="h-3 w-3" />
                      {errors.scamDetails}
                    </p>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div className="transition-all duration-200 hover:translate-x-1">
                <Label htmlFor="files" className="text-base">
                  Supporting Evidence (Optional)
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Upload documents to support your request
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">File Requirements:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong>Allowed formats:</strong> PDF, JPG, PNG</li>
                        <li><strong>Maximum size:</strong> 10MB per file</li>
                        <li><strong>Maximum files:</strong> 3 files total</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {files.length < 3 && (
                  <div className="mt-2">
                    <label
                      htmlFor="fileInput"
                      className="flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                    >
                      {uploadingFiles ? (
                        <>
                          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                          <span className="text-gray-600 dark:text-gray-400">Processing files...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mb-2 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            Click to upload files
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            PDF, JPG, PNG • Max 10MB each
                          </span>
                        </>
                      )}
                    </label>
                    <input
                      id="fileInput"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploadingFiles}
                    />
                  </div>
                )}

                {errors.files && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1 animate-shake">
                    <AlertCircle className="h-3 w-3" />
                    {errors.files}
                  </p>
                )}

                {files.length > 0 && (
                  <div className="mt-4 space-y-2 animate-fade-in">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Uploaded Files ({files.length}/3):
                    </p>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">{getFileIcon(file.name)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-3 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                          title="Remove file"
                        >
                          <X className="h-4 w-4 text-gray-500 group-hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={submitting}
                  className="transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-xs text-yellow-800 dark:text-yellow-300 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Your submission will be sent via email and reviewed by our community support team.
                    Personal information is handled with strict confidentiality.
                  </span>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .required::after {
          content: " *";
          color: #ef4444;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}