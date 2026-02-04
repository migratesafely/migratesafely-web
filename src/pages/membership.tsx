import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MainHeader } from "@/components/MainHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Check, Shield, Users, Award, TrendingUp, Calendar, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicPageTeaser } from "@/components/PublicPageTeaser";

const TRANSLATIONS = {
  en: {
    pageTitle: "Membership Benefits - MigrateSafely.com",
    metaDescription: "Join MigrateSafely.com membership: 365-day validity, verified agent connections, scam protection, automatic prize draws, local currency support, and comprehensive migration safety features.",
    heroTitle: "Join Our Protected Community",
    heroSubtitle: "Membership is available through a paid annual plan that provides full access to all protection and verification features. 365 days of comprehensive protection awaits.",
    joinButton: "Join as a Member",
    learnMoreButton: "Learn More",
    benefitsTitle: "Comprehensive Membership Benefits",
    benefitsSubtitle: "Everything you need for safe migration",
    validityTitle: "365-Day Validity",
    validityDesc: "Full year of protection and access to all features",
    scamProtectionTitle: "Scam Protection",
    scamProtectionDesc: "Access to verified scam reports and blacklist database",
    verifiedAgentsTitle: "Verified Agent Connections",
    verifiedAgentsDesc: "Connect with pre-vetted, trustworthy migration agents",
    prizeDrawsTitle: "Automatic Prize Draws",
    prizeDrawsDesc: "Automatic entry in all prize draws - completely free of charge for paid members",
    embassyDirectoryTitle: "Embassy Directory",
    embassyDirectoryDesc: "Quick access to official embassy information",
    supportTitle: "Priority Support",
    supportDesc: "Fast response and dedicated assistance",
    prizeDrawDetailsTitle: "About Prize Draws",
    prizeDrawDetailsDesc: "Prize draws are completely free of charge and are available exclusively to registered, paid members. This is a membership benefit, not a lottery or gambling service.",
    whyMembershipTitle: "Why Choose Membership?",
    verifiedCommunityTitle: "Verified Community",
    verifiedCommunityDesc: "Join a trusted network of verified members and agents",
    comprehensiveProtectionTitle: "Comprehensive Protection",
    comprehensiveProtectionDesc: "All-in-one solution for safe migration",
    localCurrencyTitle: "Local Currency Support",
    localCurrencyDesc: "Pay in BDT with local payment options",
    ongoingUpdatesTitle: "Ongoing Updates",
    ongoingUpdatesDesc: "Continuous access to latest scam alerts and information",
    faqTitle: "Frequently Asked Questions",
    faq1Q: "Is membership free?",
    faq1A: "No. MigrateSafely operates on a paid annual membership model to ensure verified services, scam prevention, and ongoing member protection.",
    faq2Q: "How long is membership valid?",
    faq2A: "Membership is valid for 365 days from the date of activation. You'll receive renewal reminders before expiration.",
    faq3Q: "What payment methods do you accept?",
    faq3A: "We accept credit/debit cards, mobile banking (bKash, Nagad, Rocket), and bank transfers in BDT.",
    faq4Q: "How do prize draws work?",
    faq4A: "Paid members are automatically entered into regular prize draws at no additional cost. Winners are announced publicly and notified via email. Prize draws are completely free of charge and are not gambling or lottery services.",
    ctaTitle: "Ready to Get Started?",
    ctaSubtitle: "Membership is available through a paid annual plan that provides full access to all protection and verification features. 365 days of comprehensive protection awaits.",
    joinNowButton: "Join as a Member"
  },
  bn: {
    pageTitle: "সদস্যপদ সুবিধা - MigrateSafely.com",
    metaDescription: "MigrateSafely.com সদস্যপদে যোগ দিন: ৩৬৫ দিনের বৈধতা, যাচাইকৃত এজেন্ট সংযোগ, প্রতারণা সুরক্ষা, স্বয়ংক্রিয় পুরস্কার ড্র, স্থানীয় মুদ্রা সহায়তা এবং ব্যাপক অভিবাসন নিরাপত্তা বৈশিষ্ট্য।",
    heroTitle: "আমাদের সুরক্ষিত কমিউনিটিতে যোগ দিন",
    heroSubtitle: "সদস্যপদ একটি পেইড বার্ষিক প্ল্যানের মাধ্যমে উপলব্ধ যা সমস্ত সুরক্ষা এবং যাচাইকরণ বৈশিষ্ট্যগুলিতে সম্পূর্ণ অ্যাক্সেস প্রদান করে। ৩৬৫ দিনের ব্যাপক সুরক্ষা অপেক্ষা করছে।",
    joinButton: "সদস্য হিসেবে যোগ দিন",
    learnMoreButton: "আরও জানুন",
    benefitsTitle: "ব্যাপক সদস্যপদ সুবিধা",
    benefitsSubtitle: "নিরাপদ অভিবাসনের জন্য আপনার প্রয়োজনীয় সবকিছু",
    validityTitle: "৩৬৫ দিনের বৈধতা",
    validityDesc: "সমস্ত বৈশিষ্ট্যগুলিতে সুরক্ষা এবং অ্যাক্সেসের সম্পূর্ণ বছর",
    scamProtectionTitle: "প্রতারণা সুরক্ষা",
    scamProtectionDesc: "যাচাইকৃত প্রতারিক্ত রিপোর্ট এবং ব্ল্যাকলিস্ট ডেটাবেসে অ্যাক্সেস",
    verifiedAgentsTitle: "যাচাইকৃত এজেন্ট সংযোগ",
    verifiedAgentsDesc: "পূর্ব-যাচাইকৃত, বিশ্বস্ত অভিবাসন এজেন্টদের সাথে সংযোগ করুন",
    prizeDrawsTitle: "স্বয়ংক্রিয় পুরস্কার ড্র",
    prizeDrawsDesc: "সমস্ত পুরস্কার ড্রতে স্বয়ংক্রিয় এন্ট্রি - পেইড সদস্যদের জন্য সম্পূর্ণ বিনামূল্যে",
    embassyDirectoryTitle: "দূতাবাস ডিরেক্টরি",
    embassyDirectoryDesc: "সরকারি দূতাবাস তথ্যে দ্রুত অ্যাক্সেস",
    supportTitle: "অগ্রাধিকার সহায়তা",
    supportDesc: "দ্রুত প্রতিক্রিয়া এবং নিবেদিত সহায়তা",
    prizeDrawDetailsTitle: "পুরস্কার ড্র সম্পর্কে",
    prizeDrawDetailsDesc: "পুরস্কার ড্র সম্পূর্ণ বিনামূল্যে এবং শুধুমাত্র নিবন্ধিত, পেইড সদস্যদের জন্য উপলব্ধ। এটি একটি সদস্যপদ সুবিধা, লটারি বা জুয়া সেবা নয়।",
    whyMembershipTitle: "কেন সদস্যপদ বেছে নেবেন?",
    verifiedCommunityTitle: "যাচাইকৃত কমিউনিটি",
    verifiedCommunityDesc: "যাচাইকৃত সদস্য এবং এজেন্টদের একটি বিশ্বস্ত নেটওয়ার্কে যোগ দিন",
    comprehensiveProtectionTitle: "ব্যাপক সুরক্ষা",
    comprehensiveProtectionDesc: "নিরাপদ অভিবাসনের জন্য অল-ইন-ওয়ান সমাধান",
    localCurrencyTitle: "স্থানীয় মুদ্রা সহায়তা",
    localCurrencyDesc: "স্থানীয় পেমেন্ট বিকল্প সহ BDT-তে পেমেন্ট করুন",
    ongoingUpdatesTitle: "চলমান আপডেট",
    ongoingUpdatesDesc: "সর্বশেষ প্রতারণা সতর্কতা এবং তথ্যে ক্রমাগত অ্যাক্সেস",
    faqTitle: "প্রায়শই জিজ্ঞাসিত প্রশ্ন",
    faq1Q: "সদস্যপদ কি বিনামূল্যে?",
    faq1A: "না। MigrateSafely যাচাইকৃত সেবা, প্রতারিক্ত প্রতিরোধ এবং চলমান সদস্য সুরক্ষা নিশ্চিত করতে একটি পেইড বার্ষিক সদস্যপদ মডেলে কাজ করে।",
    faq2Q: "সদস্যপদ কতদিন বৈধ?",
    faq2A: "সক্রিয়করণের তারিখ থেকে সদস্যপদ ৩৬৫ দিনের জন্য বৈধ। মেয়াদ শেষ হওয়ার আগে আপনি নবায়ন অনুস্মারক পাবেন।",
    faq3Q: "আপনি কোন পেমেন্ট পদ্ধতি গ্রহণ করেন?",
    faq3A: "আমরা BDT-তে ক্রেডিট/ডেবিট কার্ড, মোবাইল ব্যাংকিং (bKash, Nagad, Rocket) এবং ব্যাংক ট্রান্সফার গ্রহণ করি।",
    faq4Q: "পুরস্কার ড্র কিভাবে কাজ করে?",
    faq4A: "পেইড সদস্যরা স্বয়ংক্রিয়ভাবে কোন অতিরিক্ত খরচ ছাড়াই নিয়মিত পুরস্কার ড্রতে প্রবেশ করে। বিজয়ীদের প্রকাশ্যে ঘোষণা করা হয় এবং ইমেইলের মাধ্যমে অবহিত করা হয়। পুরস্কার ড্র সম্পূর্ণ বিনামূল্যে এবং জুয়া বা লটারি সেবা নয়।",
    ctaTitle: "শুরু করতে প্রস্তুত?",
    ctaSubtitle: "সদস্যপদ একটি পেইড বার্ষিক প্ল্যানের মাধ্যমে উপলব্ধ যা সমস্ত সুরক্ষা এবং যাচাইকরণ বৈশিষ্ট্যগুলিতে সম্পূর্ণ অ্যাক্সেস প্রদান করে। ৩৬৫ দিনের ব্যাপক সুরক্ষা অপেক্ষা করছে।",
    joinNowButton: "সদস্য হিসেবে যোগ দিন"
  }
};

export default function MembershipPage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];
  const [membershipFee, setMembershipFee] = useState<number | null>(null);

  useEffect(() => {
    // Ideally fetch from API, but for static page we might not need it if not displaying dynamic price
    // Or we can fetch it to display accurate pricing
  }, []);

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>
      <MainHeader />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  {t.joinButton}
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  {t.learnMoreButton}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Member-Only Teaser */}
        <div className="mb-12">
          <PublicPageTeaser showCTA={true} />
        </div>

        {/* Membership Benefits */}
        <section className="py-16 px-6">
          {/* Benefits Grid */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.benefitsTitle}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {t.benefitsSubtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <Calendar className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                    <CardTitle>{t.validityTitle}</CardTitle>
                    <CardDescription>{t.validityDesc}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <Shield className="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
                    <CardTitle>{t.scamProtectionTitle}</CardTitle>
                    <CardDescription>{t.scamProtectionDesc}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <Users className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
                    <CardTitle>{t.verifiedAgentsTitle}</CardTitle>
                    <CardDescription>{t.verifiedAgentsDesc}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <Award className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mb-4" />
                    <CardTitle>{t.prizeDrawsTitle}</CardTitle>
                    <CardDescription>{t.prizeDrawsDesc}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <Globe className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-4" />
                    <CardTitle>{t.embassyDirectoryTitle}</CardTitle>
                    <CardDescription>{t.embassyDirectoryDesc}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <CheckCircle2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-4" />
                    <CardTitle>{t.supportTitle}</CardTitle>
                    <CardDescription>{t.supportDesc}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>

          {/* Prize Draw Information */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="max-w-4xl mx-auto">
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <Award className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mb-4" />
                  <CardTitle className="text-2xl">{t.prizeDrawDetailsTitle}</CardTitle>
                  <CardDescription className="text-base">
                    {t.prizeDrawDetailsDesc}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Why Membership Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                {t.whyMembershipTitle}
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t.verifiedCommunityTitle}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.verifiedCommunityDesc}
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t.comprehensiveProtectionTitle}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.comprehensiveProtectionDesc}
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t.localCurrencyTitle}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.localCurrencyDesc}
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t.ongoingUpdatesTitle}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.ongoingUpdatesDesc}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                {t.faqTitle}
              </h2>

              <div className="space-y-6">
                <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-xl">{t.faq1Q}</CardTitle>
                    <CardDescription className="text-base">{t.faq1A}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-xl">{t.faq2Q}</CardTitle>
                    <CardDescription className="text-base">{t.faq2A}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-xl">{t.faq3Q}</CardTitle>
                    <CardDescription className="text-base">{t.faq3A}</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-xl">{t.faq4Q}</CardTitle>
                    <CardDescription className="text-base">{t.faq4A}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t.ctaTitle}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {t.ctaSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    {t.joinNowButton}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </section>
      </div>
    </>
  );
}