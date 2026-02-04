import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Shield, Upload, X } from "lucide-react";
import Head from "next/head";
import { SEO } from "@/components/SEO";

export default function VerifyAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Member data
  const [memberData, setMemberData] = useState<any>(null);
  const [submissionsThisYear, setSubmissionsThisYear] = useState(0);
  
  // Form data
  const [agentName, setAgentName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [websiteOrSocial, setWebsiteOrSocial] = useState("");
  const [agentCountry, setAgentCountry] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [services, setServices] = useState<string[]>([]);
  
  // Risk indicators
  const [askedUpfrontPayment, setAskedUpfrontPayment] = useState<boolean | null>(null);
  const [promisedGuarantee, setPromisedGuarantee] = useState<boolean | null>(null);
  const [askedDocumentsEarly, setAskedDocumentsEarly] = useState<boolean | null>(null);
  const [refusedLicense, setRefusedLicense] = useState<boolean | null>(null);
  const [privateCommOnly, setPrivateCommOnly] = useState<boolean | null>(null);
  
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Error states
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
        .select("full_name, country_code")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setGeneralError("Unable to load your profile");
        setLoading(false);
        return;
      }

      // Get membership
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("membership_number, status")
        .eq("user_id", user.id)
        .single();

      if (membershipError || !membership) {
        setGeneralError("You must be a member to use this service");
        setLoading(false);
        return;
      }

      if (membership.status !== "active") {
        setGeneralError("Only active members can submit verification requests");
        setLoading(false);
        return;
      }

      setMemberData({
        fullName: profile.full_name,
        email: user.email,
        membershipNumber: membership.membership_number,
        country: profile.country_code
      });

      // Check submissions this year
      const currentYear = new Date().getFullYear();
      const { count } = await supabase
        .from("agent_verification_requests")
        .select("*", { count: "exact", head: true })
        .eq("member_id", user.id)
        .gte("created_at", `${currentYear}-01-01`);

      setSubmissionsThisYear(count || 0);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setGeneralError("An error occurred while loading your data");
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFileError("");

    if (files.length + selectedFiles.length > 5) {
      setFileError("Maximum 5 files allowed");
      return;
    }

    const validFiles: File[] = [];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setFileError(`${file.name}: Only PDF, JPG, and PNG files are allowed`);
        continue;
      }
      if (file.size > maxSize) {
        setFileError(`${file.name} exceeds 10MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setFileError("");
  };

  const handleServiceToggle = (service: string) => {
    if (services.includes(service)) {
      setServices(services.filter(s => s !== service));
    } else {
      setServices([...services, service]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submissionsThisYear >= 3) {
      setGeneralError("You have reached the maximum of 3 verification requests per year");
      return;
    }

    setSubmitting(true);
    setGeneralError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("agentName", agentName);
      formData.append("companyName", companyName);
      formData.append("phoneNumber", phoneNumber);
      formData.append("whatsappNumber", whatsappNumber);
      formData.append("email", email);
      formData.append("websiteOrSocial", websiteOrSocial);
      formData.append("agentCountry", agentCountry);
      formData.append("contactMethod", contactMethod);
      formData.append("services", JSON.stringify(services));
      formData.append("askedUpfrontPayment", String(askedUpfrontPayment));
      formData.append("promisedGuarantee", String(promisedGuarantee));
      formData.append("askedDocumentsEarly", String(askedDocumentsEarly));
      formData.append("refusedLicense", String(refusedLicense));
      formData.append("privateCommOnly", String(privateCommOnly));
      formData.append("additionalDetails", additionalDetails);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/agent-verification/submit", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess(true);
    } catch (error: any) {
      setGeneralError(error.message || "Failed to submit verification request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Head>
          <title>Verification Request Submitted | Migrate Safely</title>
        </Head>
        <MainHeader />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 text-center animate-scale-in">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto animate-bounce-once">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verification Request Received
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your verification request has been received.<br />
              Our team will review the details and may contact you through the internal messaging system.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Our team will conduct basic verification checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>We will send you an internal message with our findings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>This typically takes 3-5 business days</span>
                </li>
              </ul>
            </div>

            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </Card>
        </div>

        <style jsx>{`
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
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
          .animate-bounce-once {
            animation: bounce-once 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <MainHeader />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError || "Unable to load member data"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const canSubmit = submissionsThisYear < 3;

  return (
    <>
      <SEO
        title="Verify an Agent - MigrateSafely"
        description="Verify the credentials of a migration agent before you proceed"
      />
      <MainHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <Head>
          <title>Request Agent Verification | Migrate Safely</title>
          <meta name="description" content="Submit agent details for verification to protect yourself from scams" />
        </Head>
        
        <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fade-in-up">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Request Agent Verification
              </h1>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              Have you been contacted by a migration agent or advisor and want to verify their legitimacy?<br />
              Submit the details below and our team will conduct basic verification checks to help protect you from scams.
            </p>

            <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> Migratesafely.com does not accuse or investigate crimes.
                This service provides basic verification checks and risk indicators only.
              </AlertDescription>
            </Alert>

            {!canSubmit && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have reached the maximum of 3 verification requests per year.
                  You may submit again starting next calendar year.
                </AlertDescription>
              </Alert>
            )}

            {canSubmit && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Submissions this year:</strong> {submissionsThisYear} / 3
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Auto-filled Member Data */}
            <Card className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Information (Auto-filled)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Membership Number</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{memberData.membershipNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{memberData.fullName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{memberData.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Country</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{memberData.country}</p>
                </div>
              </div>
            </Card>

            {/* Agent/Contact Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Agent / Contact Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 required">
                    Agent / Individual Name
                  </label>
                  <input
                    type="text"
                    required
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Full name of the person who contacted you"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company or Business Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 required">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="+880..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      WhatsApp / Messaging App Number
                    </label>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website or Social Media Profile
                  </label>
                  <input
                    type="url"
                    value={websiteOrSocial}
                    onChange={(e) => setWebsiteOrSocial(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 required">
                    Country where agent claims to operate
                  </label>
                  <input
                    type="text"
                    required
                    value={agentCountry}
                    onChange={(e) => setAgentCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="e.g. Bangladesh, India, UAE"
                  />
                </div>
              </div>
            </Card>

            {/* Contact Context */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Context
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 required">
                    How did you come into contact with this agent?
                  </label>
                  <select
                    required
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="walk-in">Walk-in office</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 required">
                    What service were they offering? (Select all that apply)
                  </label>
                  <div className="space-y-2">
                    {["Student visa", "Work visa", "Immigration / PR", "Job placement", "Document processing", "Other"].map((service) => (
                      <label key={service} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Risk Indicators */}
            <Card className="p-6 border-2 border-orange-200 dark:border-orange-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Risk Indicators
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please answer honestly to help us assess the situation
              </p>
              <div className="space-y-4">
                {[
                  { label: "Asked for upfront payment?", state: askedUpfrontPayment, setState: setAskedUpfrontPayment },
                  { label: "Promised guaranteed visa?", state: promisedGuarantee, setState: setPromisedGuarantee },
                  { label: "Asked for documents before contract?", state: askedDocumentsEarly, setState: setAskedDocumentsEarly },
                  { label: "Refused to provide license details?", state: refusedLicense, setState: setRefusedLicense },
                  { label: "Asked to communicate privately only?", state: privateCommOnly, setState: setPrivateCommOnly }
                ].map((item, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 required">
                      {item.label}
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`risk-${index}`}
                          required
                          checked={item.state === true}
                          onChange={() => item.setState(true)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`risk-${index}`}
                          required
                          checked={item.state === false}
                          onChange={() => item.setState(false)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Additional Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Additional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Any additional details or concerns (max 500 words)
                  </label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    rows={6}
                    maxLength={3000}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Provide any additional context that may help with verification..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {additionalDetails.length} / 3000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evidence Upload (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        Click to upload files
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        disabled={uploadingFiles || files.length >= 5}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Screenshots, messages, documents<br />
                      Max 5 files • 10MB per file • PDF, JPG, PNG
                    </p>
                  </div>

                  {fileError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{fileError}</AlertDescription>
                    </Alert>
                  )}

                  {files.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Uploaded Files ({files.length}/5):
                      </p>
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950 rounded-lg border border-gray-200 dark:border-gray-700 animate-slide-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-2xl">
                                {file.type === "application/pdf" ? "📄" : "🖼️"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                            >
                              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Legal Notice */}
            <Alert className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                This service is provided for member safety and guidance only.
                Migratesafely.com does not conduct criminal investigations or guarantee outcomes.
              </AlertDescription>
            </Alert>

            {generalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={submitting || !canSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all hover:scale-105"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Submit Verification Request
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={submitting}
                className="sm:w-auto px-8"
              >
                Cancel
              </Button>
            </div>
          </form>
        </main>

        <PublicFooter />

        <style jsx>{`
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
          .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out;
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
            opacity: 0;
          }
          .required::after {
            content: " *";
            color: #ef4444;
          }
        `}</style>
      </div>
    </>
  );
}