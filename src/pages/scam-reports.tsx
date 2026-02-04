import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicFooter } from "@/components/PublicFooter";
import { authService } from "@/services/authService";
import { AlertTriangle, Search, Filter, Loader2, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MainHeader } from "@/components/MainHeader";

const TEXT = {
  en: {
    pageTitle: "Verified Scam Reports | Migrate Safely",
    metaDescription: "Search verified migration scam reports to protect yourself",
    title: "Verified Scam Reports",
    subtitle: "Search our database of verified scammers",
    searchPlaceholder: "Search by name, email, phone, or company...",
    filterCountry: "Filter by Country",
    allCountries: "All Countries",
    searchButton: "Search",
    loading: "Loading reports...",
    loginRequired: "Please log in to view scam reports",
    membershipRequired: "Active membership required to access scam reports",
    noReports: "No verified scam reports found",
    reportedBy: "Reported by:",
    incidentDate: "Incident Date:",
    country: "Country:",
    viewDetails: "View Details",
    closeDetails: "Close",
    scammerDetails: "Scammer Details",
    name: "Name:",
    email: "Email:",
    phone: "Phone:",
    company: "Company:",
    incidentDescription: "Incident Description:",
    evidence: "Evidence:",
    verifiedBy: "Verified by admin"
  },
  bn: {
    pageTitle: "যাচাইকৃত প্রতারণা রিপোর্ট | নিরাপদে মাইগ্রেট করুন",
    metaDescription: "নিজেকে রক্ষা করতে যাচাইকৃত মাইগ্রেশন প্রতারণা রিপোর্ট অনুসন্ধান করুন",
    title: "যাচাইকৃত প্রতারণা রিপোর্ট",
    subtitle: "যাচাইকৃত প্রতারকদের আমাদের ডাটাবেস অনুসন্ধান করুন",
    searchPlaceholder: "নাম, ইমেইল, ফোন, বা কোম্পানি দ্বারা অনুসন্ধান করুন...",
    filterCountry: "দেশ দ্বারা ফিল্টার করুন",
    allCountries: "সব দেশ",
    searchButton: "অনুসন্ধান করুন",
    loading: "রিপোর্ট লোড হচ্ছে...",
    loginRequired: "প্রতারণা রিপোর্ট দেখতে দয়া করে লগইন করুন",
    membershipRequired: "প্রতারণা রিপোর্ট অ্যাক্সেস করতে সক্রিয় সদস্যপদ প্রয়োজন",
    noReports: "কোন যাচাইকৃত প্রতারণা রিপোর্ট পাওয়া যায়নি",
    reportedBy: "রিপোর্ট করেছেন:",
    incidentDate: "ঘটনার তারিখ:",
    country: "দেশ:",
    viewDetails: "বিস্তারিত দেখুন",
    closeDetails: "বন্ধ করুন",
    scammerDetails: "প্রতারকের বিবরণ",
    name: "নাম:",
    email: "ইমেইল:",
    phone: "ফোন:",
    company: "কোম্পানি:",
    incidentDescription: "ঘটনার বিবরণ:",
    evidence: "প্রমাণ:",
    verifiedBy: "অ্যাডমিন দ্বারা যাচাইকৃত"
  }
};

interface ScamReport {
  id: string;
  scammer_name: string;
  scammer_email: string | null;
  scammer_phone: string | null;
  scammer_company: string | null;
  incident_description: string;
  incident_date: string;
  country: string;
  reporter_name: string;
  created_at: string;
  evidence_urls: string[];
}

export default function ScamReportsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXT[language];
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<ScamReport | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setAuthError(t.loginRequired);
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      loadReports();
    } catch (error) {
      setAuthError(t.loginRequired);
      setLoading(false);
    }
  }

  async function loadReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (countryFilter) params.append("country", countryFilter);

      const response = await fetch(`/api/scam-reports/list-verified?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setReports(data.reports || []);
      } else if (response.status === 403) {
        setAuthError(t.membershipRequired);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    loadReports();
  }

  const countries = Array.from(new Set(reports.map((r) => r.country))).sort();

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <MainHeader />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t.subtitle}
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center mb-8">
              <p className="text-red-900 dark:text-red-100 mb-4">{authError}</p>
              {!isAuthenticated && (
                <Button onClick={() => router.push("/login")}>
                  Login
                </Button>
              )}
            </div>
          )}

          {isAuthenticated && (
            <>
              <div className="mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-48">
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">{t.allCountries}</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={handleSearch} className="w-full sm:w-auto">
                    <Search className="h-4 w-4 mr-2" />
                    {t.searchButton}
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              )}

              {!loading && reports.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.noReports}
                  </p>
                </div>
              )}

              {!loading && reports.length > 0 && (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200 dark:border-red-900 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {report.scammer_name}
                          </h3>
                          {report.scammer_company && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {report.scammer_company}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => setSelectedReport(report)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t.viewDetails}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t.country}</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.country}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t.incidentDate}</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(report.incident_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t.reportedBy}</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.reporter_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.scammerDetails}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.name}</p>
                <p className="text-base text-gray-900 dark:text-white">{selectedReport.scammer_name}</p>
              </div>

              {selectedReport.scammer_email && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.email}</p>
                  <p className="text-base text-gray-900 dark:text-white">{selectedReport.scammer_email}</p>
                </div>
              )}

              {selectedReport.scammer_phone && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.phone}</p>
                  <p className="text-base text-gray-900 dark:text-white">{selectedReport.scammer_phone}</p>
                </div>
              )}

              {selectedReport.scammer_company && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.company}</p>
                  <p className="text-base text-gray-900 dark:text-white">{selectedReport.scammer_company}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.country}</p>
                <p className="text-base text-gray-900 dark:text-white">{selectedReport.country}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.incidentDate}</p>
                <p className="text-base text-gray-900 dark:text-white">
                  {new Date(selectedReport.incident_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.incidentDescription}</p>
                <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedReport.incident_description}
                </p>
              </div>

              {selectedReport.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.evidence}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.evidence_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Evidence {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ {t.verifiedBy}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <PublicFooter />
    </>
  );
}