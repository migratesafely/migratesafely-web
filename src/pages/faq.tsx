import { AppHeader } from "@/components/AppHeader";
import { FAQSection } from "@/components/FAQSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { ArrowRight } from "lucide-react";

const TEXT = {
  en: {
    pageTitle: "Frequently Asked Questions | Migrate Safely",
    metaDescription: "Find answers to common questions about membership benefits, prize draws, agent verification, and more.",
    intro: "Find answers to common questions about Migratesafely.com membership, benefits, and services.",
    ctaTitle: "Still have questions?",
    ctaDescription: "Our support team is here to help you migrate safely.",
    ctaButton: "Contact Support"
  },
  bn: {
    pageTitle: "প্রায়শই জিজ্ঞাসিত প্রশ্ন | নিরাপদে মাইগ্রেট করুন",
    metaDescription: "সদস্যপদ সুবিধা, পুরস্কার ড্র, এজেন্ট যাচাইকরণ এবং আরও অনেক কিছু সম্পর্কে সাধারণ প্রশ্নের উত্তর খুঁজুন।",
    intro: "Migratesafely.com সদস্যপদ, সুবিধা এবং সেবা সম্পর্কে সাধারণ প্রশ্নের উত্তর খুঁজুন।",
    ctaTitle: "এখনও প্রশ্ন আছে?",
    ctaDescription: "আমাদের সাপোর্ট টিম আপনাকে নিরাপদে মাইগ্রেট করতে সাহায্য করতে এখানে আছে।",
    ctaButton: "সাপোর্টের সাথে যোগাযোগ করুন"
  }
};

export default function FAQPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const t = TEXT[language as keyof typeof TEXT];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO
        title={t.pageTitle}
        description={t.metaDescription}
      />
      
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Find answers to common questions about our services
          </p>
        </div>

        <FAQSection />

        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t.ctaTitle}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.ctaDescription}
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/support")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t.ctaButton}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}