import { useState, useEffect } from "react";
import Head from "next/head";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { MapPin, Phone, Mail, Globe as GlobeIcon, Loader2, Building2, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TEXT = {
  en: {
    pageTitle: "Embassy Directory | Migrate Safely",
    metaDescription: "Find official embassy and consulate contacts for safe migration",
    title: "Embassy Directory",
    subtitle: "Find official embassy and consulate contacts",
    filterCountry: "Filter by Country",
    filterType: "Filter by Type",
    allCountries: "All Countries",
    allTypes: "All Types",
    bdEmbassies: "Bangladesh Embassies",
    foreignEmbassies: "Foreign Embassies in Bangladesh",
    loading: "Loading embassies...",
    noEmbassies: "No embassies found matching your filters",
    address: "Address:",
    phone: "Phone:",
    email: "Email:",
    website: "Website:",
    visitWebsite: "Visit Website",
    contactSummary: "Contact Summary:",
    moreDetails: "More details",
    lastVerified: "Last verified:"
  },
  bn: {
    pageTitle: "দূতাবাস ডিরেক্টরি | নিরাপদে মাইগ্রেট করুন",
    metaDescription: "নিরাপদ মাইগ্রেশনের জন্য অফিসিয়াল দূতাবাস এবং কনস্যুলেট যোগাযোগ খুঁজুন",
    title: "দূতাবাস ডিরেক্টরি",
    subtitle: "অফিসিয়াল দূতাবাস এবং কনস্যুলেট যোগাযোগ খুঁজুন",
    filterCountry: "দেশ দ্বারা ফিল্টার করুন",
    filterType: "ধরন দ্বারা ফিল্টার করুন",
    allCountries: "সব দেশ",
    allTypes: "সব ধরন",
    bdEmbassies: "বাংলাদেশ দূতাবাস",
    foreignEmbassies: "বাংলাদেশে বিদেশী দূতাবাস",
    loading: "দূতাবাস লোড হচ্ছে...",
    noEmbassies: "আপনার ফিল্টার মিলে কোন দূতাবাস পাওয়া যায়নি",
    address: "ঠিকানা:",
    phone: "ফোন:",
    email: "ইমেইল:",
    website: "ওয়েবসাইট:",
    visitWebsite: "ওয়েবসাইট ভিজিট করুন",
    contactSummary: "যোগাযোগ সারাংশ:",
    moreDetails: "আরো বিস্তারিত",
    lastVerified: "সর্বশেষ যাচাই:"
  }
};

interface Embassy {
  id: string;
  name: string;
  country_code: string;
  embassy_type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_summary: string | null;
  contact_details: string | null;
  last_verified_at: string | null;
}

export default function EmbassyDirectoryPage() {
  const { language } = useLanguage();
  const t = TEXT[language];
  
  const [embassies, setEmbassies] = useState<Embassy[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadEmbassies();
  }, [countryFilter, typeFilter]);

  async function loadEmbassies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (countryFilter !== "all") params.append("country", countryFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(`/api/embassies/list?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setEmbassies(data.embassies || []);
      }
    } catch (error) {
      console.error("Error loading embassies:", error);
    } finally {
      setLoading(false);
    }
  }

  const countries = Array.from(new Set(embassies.map((e) => e.country_code))).sort();

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <AppHeader />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building2 className="h-10 w-10 text-green-600" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {t.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t.subtitle}
            </p>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.filterCountry}
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="all">{t.allCountries}</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.filterType}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="all">{t.allTypes}</option>
                <option value="bd_embassy">{t.bdEmbassies}</option>
                <option value="foreign_embassy">{t.foreignEmbassies}</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          )}

          {!loading && embassies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t.noEmbassies}
              </p>
            </div>
          )}

          {!loading && embassies.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {embassies.map((embassy) => (
                <div
                  key={embassy.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {embassy.name}
                  </h2>

                  {embassy.contact_summary && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t.contactSummary}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {embassy.contact_summary}
                      </p>
                    </div>
                  )}

                  {embassy.address && (
                    <div className="flex items-start gap-3 mb-3">
                      <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.address}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {embassy.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {embassy.phone && (
                    <div className="flex items-center gap-3 mb-3">
                      <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.phone}
                        </p>
                        <a
                          href={`tel:${embassy.phone}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {embassy.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {embassy.email && (
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.email}
                        </p>
                        <a
                          href={`mailto:${embassy.email}`}
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {embassy.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {embassy.website && (
                    <div className="flex items-center gap-3 mb-3">
                      <GlobeIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.website}
                        </p>
                        <a
                          href={embassy.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          {t.visitWebsite}
                        </a>
                      </div>
                    </div>
                  )}

                  {embassy.contact_details && (
                    <Accordion type="single" collapsible className="mt-4">
                      <AccordionItem value="details" className="border-none">
                        <AccordionTrigger className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-2">
                          {t.moreDetails}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mt-2">
                            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                              {embassy.contact_details}
                            </pre>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {embassy.last_verified_at && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.lastVerified} {new Date(embassy.last_verified_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}