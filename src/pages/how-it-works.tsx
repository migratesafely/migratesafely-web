import Head from "next/head";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search, UserCheck, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TRANSLATIONS = {
  en: {
    pageTitle: "How It Works - MigrateSafely.com",
    metaDescription: "Learn how MigrateSafely.com connects you with verified migration agents through our secure, request-based process.",
    heroTitle: "How MigrateSafely Works",
    heroSubtitle: "Your simple 4-step journey to safe migration support",
    step1Title: "Join as a Member",
    step1Desc: "Sign up and pay your annual membership fee. This gives you full access to our protected platform, verified agent network, and all member benefits for 365 days.",
    step2Title: "Submit Agent Request",
    step2Desc: "Tell us what you need. Fill out a simple request form detailing your migration goals, destination country, and specific requirements.",
    step3Title: "We Match You",
    step3Desc: "Our team reviews your request and manually matches you with verified agents who specialize in your specific needs. We ensure the agent is qualified and available.",
    step4Title: "Connect & Proceed",
    step4Desc: "Once matched, you'll receive the agent's verified contact details. You can then discuss your case, fees, and next steps directly with a trusted professional.",
    benefitsTitle: "Why This Process Works",
    benefit1Title: "No Spam or Scams",
    benefit1Desc: "By not publicly listing agents, we prevent scammers from impersonating them and stop you from being bombarded with unsolicited offers.",
    benefit2Title: "Quality Control",
    benefit2Desc: "We monitor every connection. If an agent fails to deliver or acts unethically, they are removed from our platform instantly.",
    benefit3Title: "Verified Professionals Only",
    benefit3Desc: "You only interact with agents who have passed our rigorous verification process, including license checks and background screenings.",
    ctaTitle: "Start Your Safe Journey Today",
    ctaSubtitle: "Join thousands of members who are migrating safely with verified support.",
    joinButton: "Join as a Member"
  },
  bn: {
    pageTitle: "এটি কীভাবে কাজ করে - MigrateSafely.com",
    metaDescription: "জানুন কীভাবে MigrateSafely.com আমাদের নিরাপদ, অনোধ-ভিত্তিক প্রক্রিয়ার মাধ্যমে যাচাইকৃত মাইগ্রেশন এজেন্টদের সাথে আপনাকে সংযুক্ত করে।",
    heroTitle: "MigrateSafely কীভাবে কাজ করে",
    heroSubtitle: "নিরাপদ অভিবাসন সহায়তার জন্য আপনার সহজ ৪-ধাপের যাত্রা",
    step1Title: "সদস্য হিসেবে যোগ দিন",
    step1Desc: "সাইন আপ করুন এবং আপনার বার্ষিক সদস্যপদ ফি প্রদান করুন। এটি আপনাকে ৩৬৫ দিনের জন্য আমাদের সুরক্ষিত প্ল্যাটফর্ম, যাচাইকৃত এজেন্ট নেটওয়ার্ক এবং সমস্ত সদস্য সুবিধাগুলিতে সম্পূর্ণ অ্যাক্সেস দেয়।",
    step2Title: "এজেন্ট অনোধ জমা দিন",
    step2Desc: "আপনার কী প্রয়োজন তা আমাদের বলুন। আপনার অভিবাসন লক্ষ্য, গন্তব্য দেশ এবং নির্দিষ্ট প্রয়োজনে বিশেষজ্ঞ। আপনার কী প্রয়োজনীয়তা বিশেষ বিবরণ করে একটি সহজ অনোধ ফর্ম পূরণ করুন।",
    step3Title: "আমরা আপনাকে মেলাই",
    step3Desc: "আমাদের টিম আপনার অনুরোধ পর্যালোচনা করে এবং ম্যানুয়ালি আপনাকে যাচাইকৃত এজেন্টদের সাথে মেলায় যারা আপনার নির্দিষ্ট প্রয়োজনে বিশেষজ্ঞ। আমরা নিশ্চিত করি যে এজেন্ট যোগ্য এবং উপলব্ধ।",
    step4Title: "সংযোগ এবং এগিয়ে যান",
    step4Desc: "একবার মিলে গেলে, আপনি এজেন্টের যাচাইকৃত যোগাযোগের বিবরণ পাবেন। তারপর আপনি বিশ্বস্ত পেশাদারের সাথে সরাসরি আপনার কেস, ফি এবং পরবর্তী পদক্ষেপগুলি আলোচনা করতে পারেন।",
    benefitsTitle: "কেন এই প্রক্রিয়া কাজ করে",
    benefit1Title: "কোনো স্প্যাম বা স্ক্যাম নেই",
    benefit1Desc: "এজেন্টদের সর্বজনীনভাবে তালিকাভুক্ত না করে, আমরা স্ক্যামারদের তাদের ছদ্মবেশ ধারণ করা প্রতিরোধ করি এবং আপনাকে অযাচিত অফার দিয়ে বিরক্ত করা থেকে থামাই।",
    benefit2Title: "গুণমান নিয়ন্ত্রণ",
    benefit2Desc: "আমরা প্রতিটি সংযোগ পর্যবেক্ষণ করি। যদি কোনো এজেন্ট দিতে ব্যর্থ হয় বা অনৈতিকভাবে কাজ করে, তবে তাদের তাৎক্ষণিকভাবে আমাদের প্ল্যাটফর্ম থেকে সরিয়ে দেওয়া হয়।",
    benefit3Title: "শুধুমাত্র যাচাইকৃত পেশাদার",
    benefit3Desc: "আপনি শুধুমাত্র সেই এজেন্টদের সাথে যোগাযোগ করেন যারা আমাদের কঠোর যাচাইকরণ প্রক্রিয়া পাস করেছেন, যার মধ্যে লাইসেন্স চেক এবং ব্যাকগ্রাউন্ড স্ক্রিনিং অন্তর্ভুক্ত।",
    ctaTitle: "আজই আপনার নিরাপদ যাত্রা শুরু করুন",
    ctaSubtitle: "হাজার হাজার সদস্যদের সাথে যোগ দিন যারা যাচাইকৃত সহায়তার সাথে নিরাপদে মাইগ্রেট করছেন।",
    joinButton: "সদস্য হিসেবে যোগ দিন"
  }
};

export default function HowItWorksPage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>
      <AppHeader />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-20 bg-blue-600 dark:bg-blue-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">{t.heroTitle}</h1>
            <p className="text-xl text-blue-100">{t.heroSubtitle}</p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 max-w-5xl mx-auto px-4">
          <div className="grid gap-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                1
              </div>
              <Card className="flex-1 w-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                    <CardTitle>{t.step1Title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.step1Desc}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                2
              </div>
              <Card className="flex-1 w-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Search className="h-8 w-8 text-blue-600" />
                    <CardTitle>{t.step2Title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.step2Desc}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                3
              </div>
              <Card className="flex-1 w-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <UserCheck className="h-8 w-8 text-blue-600" />
                    <CardTitle>{t.step3Title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.step3Desc}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                4
              </div>
              <Card className="flex-1 w-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                    <CardTitle>{t.step4Title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.step4Desc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
              {t.benefitsTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>{t.benefit1Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.benefit1Desc}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>{t.benefit2Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.benefit2Desc}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <UserCheck className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>{t.benefit3Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t.benefit3Desc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center px-4">
          <h2 className="text-3xl font-bold mb-4">{t.ctaTitle}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {t.ctaSubtitle}
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              {t.joinButton} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </section>
      </div>
    </>
  );
}