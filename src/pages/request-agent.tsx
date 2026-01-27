import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserCheck, CheckCircle } from "lucide-react";

const TEXT = {
  en: {
    pageTitle: "Request an Approved Agent | Migrate Safely",
    metaDescription: "Get connected with approved migration agents for personalized assistance",
    title: "Request an Approved Agent",
    subtitle: "Get personalized assistance from our network of approved migration agents",
    form: {
      yourCountry: "Your Country",
      destinationCountry: "Destination Country",
      requestType: "Request Type",
      requestTypePlaceholder: "Select request type",
      notes: "Additional Notes",
      notesPlaceholder: "Tell us about your migration needs, goals, or any specific questions...",
      submit: "Submit Request",
      submitting: "Submitting..."
    },
    requestTypes: {
      WORK: "Work Visa / Permit",
      STUDENT: "Student Visa",
      FAMILY: "Family Reunification",
      VISIT: "Visit / Tourist Visa",
      OTHER: "Other"
    },
    success: {
      title: "Request Submitted Successfully!",
      message: "Our team will review your request and assign an approved agent soon. You will be notified via email.",
      viewRequests: "View My Requests",
      submitAnother: "Submit Another Request"
    },
    errors: {
      loginRequired: "Please log in to request an agent",
      membershipRequired: "Active membership required to request an agent",
      submitFailed: "Failed to submit request. Please try again."
    },
    loading: "Loading..."
  },
  bn: {
    pageTitle: "একটি অনুমোদিত এজেন্ট অনুরোধ করুন | নিরাপদে মাইগ্রেট করুন",
    metaDescription: "ব্যক্তিগত সহায়তার জন্য অনুমোদিত মাইগ্রেশন এজেন্টদের সাথে সংযুক্ত হন",
    title: "একটি অনুমোদিত এজেন্ট অনুরোধ করুন",
    subtitle: "আমাদের অনুমোদিত মাইগ্রেশন এজেন্টদের নেটওয়ার্ক থেকে ব্যক্তিগত সহায়তা পান",
    form: {
      yourCountry: "আপনার দেশ",
      destinationCountry: "গন্তব্য দেশ",
      requestType: "অনুরোধের ধরন",
      requestTypePlaceholder: "অনুরোধের ধরন নির্বাচন করুন",
      notes: "অতিরিক্ত নোট",
      notesPlaceholder: "আপনার মাইগ্রেশন চাহিদা, লক্ষ্য বা কোন নির্দিষ্ট প্রশ্ন সম্পর্কে আমাদের বলুন...",
      submit: "অনুরোধ জমা দিন",
      submitting: "জমা দেওয়া হচ্ছে..."
    },
    requestTypes: {
      WORK: "ওয়ার্ক ভিসা / পারমিট",
      STUDENT: "স্টুডেন্ট ভিসা",
      FAMILY: "পরিবার পুনর্মিলন",
      VISIT: "ভিজিট / ট্যুরিস্ট ভিসা",
      OTHER: "অন্যান্য"
    },
    success: {
      title: "অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!",
      message: "আমাদের টিম আপনার অনুরোধ পর্যালোচনা করবে এবং শীঘ্রই একটি অনুমোদিত এজেন্ট নিয়োগ করবে। আপনাকে ইমেইলের মাধ্যমে অবহিত করা হবে।",
      viewRequests: "আমার অনুরোধ দেখুন",
      submitAnother: "আরেকটি অনুরোধ জমা দিন"
    },
    errors: {
      loginRequired: "এজেন্ট অনুরোধ করতে দয়া করে লগইন করুন",
      membershipRequired: "এজেন্ট অনুরোধ করতে সক্রিয় সদস্যপদ প্রয়োজন",
      submitFailed: "অনুরোধ জমা দিতে ব্যর্থ। দয়া করে আবার চেষ্টা করুন।"
    },
    loading: "লোড হচ্ছে..."
  }
};

const COUNTRIES = [
  "BD", "IN", "PK", "LK", "NP", "US", "CA", "GB", "AU", "NZ", "AE", "SA", "QA", "KW", "OM", "BH"
];

export default function RequestAgentPage() {
  const { language } = useLanguage();
  const t = TEXT[language];
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState("");
  const [error, setError] = useState("");

  const [memberCountry, setMemberCountry] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [requestType, setRequestType] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setAuthError(t.errors.loginRequired);
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      setAuthError(t.errors.loginRequired);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/agent-requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberCountryCode: memberCountry,
          destinationCountryCode: destinationCountry,
          requestType,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || t.errors.submitFailed);
      }
    } catch (err) {
      console.error("Error submitting request:", err);
      setError(t.errors.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>{t.pageTitle}</title>
          <meta name="description" content={t.metaDescription} />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <AppHeader />
          <main className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
        </div>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <Head>
          <title>{t.pageTitle}</title>
          <meta name="description" content={t.metaDescription} />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <AppHeader />
          <main className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">{t.errors.loginRequired}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/login")}>
                  {language === "en" ? "Login" : "লগইন"}
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Head>
          <title>{t.pageTitle}</title>
          <meta name="description" content={t.metaDescription} />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <AppHeader />
          <main className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <CardTitle className="text-green-600">{t.success.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">{t.success.message}</p>
                <div className="flex gap-4">
                  <Button onClick={() => router.push("/my-agent-requests")}>
                    {t.success.viewRequests}
                  </Button>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    {t.success.submitAnother}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <AppHeader />

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <UserCheck className="h-10 w-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t.subtitle}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Request Details" : "অনুরোধের বিবরণ"}</CardTitle>
              <CardDescription>
                {language === "en"
                  ? "Tell us about your migration needs and we'll connect you with the right agent"
                  : "আপনার মাইগ্রেশন চাহিদা সম্পর্কে আমাদের বলুন এবং আমরা আপনাকে সঠিক এজেন্টের সাথে সংযুক্ত করব"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="memberCountry">{t.form.yourCountry}</Label>
                  <select
                    id="memberCountry"
                    value={memberCountry}
                    onChange={(e) => setMemberCountry(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === "en" ? "Select your country" : "আপনার দেশ নির্বাচন করুন"}</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationCountry">{t.form.destinationCountry}</Label>
                  <select
                    id="destinationCountry"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === "en" ? "Select destination country" : "গন্তব্য দেশ নির্বাচন করুন"}</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestType">{t.form.requestType}</Label>
                  <select
                    id="requestType"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.form.requestTypePlaceholder}</option>
                    <option value="WORK">{t.requestTypes.WORK}</option>
                    <option value="STUDENT">{t.requestTypes.STUDENT}</option>
                    <option value="FAMILY">{t.requestTypes.FAMILY}</option>
                    <option value="VISIT">{t.requestTypes.VISIT}</option>
                    <option value="OTHER">{t.requestTypes.OTHER}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t.form.notes}</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.form.notesPlaceholder}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-900 dark:text-red-100">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.form.submitting}
                    </>
                  ) : (
                    t.form.submit
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}