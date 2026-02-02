import Head from "next/head";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Shield, Users, Award, Globe, FileCheck, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPageTeaser } from "@/components/PublicPageTeaser";
import { useLanguage } from "@/contexts/LanguageContext";

const TRANSLATIONS = {
  en: {
    pageTitle: "Our Services - MigrateSafely.com",
    metaDescription: "Comprehensive migration support services including scam prevention, verified agent connections, embassy directory, prize draws, and ongoing member protection.",
    heroTitle: "Comprehensive Migration Support Services",
    heroSubtitle: "Everything you need for a safe and successful migration journey",
    servicesTitle: "Our Core Services",
    scamPreventionTitle: "Scam Prevention & Reporting",
    scamPreventionDesc: "Report suspicious activity, verify agent credentials, and access our comprehensive scam blacklist to protect yourself from fraud.",
    verifiedAgentsTitle: "Verified Agent Connections",
    verifiedAgentsDesc: "Connect with pre-vetted, trustworthy migration agents who have been thoroughly screened and verified by our team.",
    embassyDirectoryTitle: "Embassy Directory",
    embassyDirectoryDesc: "Quick access to official embassy contact information, addresses, and services for your destination country.",
    prizeDrawsTitle: "Member Prize Draws",
    prizeDrawsDesc: "Automatic entry into regular prize draws exclusively for paid members. Completely free of charge - not gambling or lottery.",
    identityVerificationTitle: "Identity Verification",
    identityVerificationDesc: "Optional identity verification service to build trust within the community and access enhanced features.",
    ongoingSupportTitle: "Ongoing Support & Updates",
    ongoingSupportDesc: "Continuous access to updated information, community support, and assistance throughout your migration journey.",
    whyChooseTitle: "Why Choose MigrateSafely?",
    whyChooseSubtitle: "Your trusted partner in safe migration",
    comprehensiveTitle: "Comprehensive Protection",
    comprehensiveDesc: "All-in-one platform covering every aspect of safe migration from start to finish.",
    verifiedNetworkTitle: "Verified Network",
    verifiedNetworkDesc: "Access to thoroughly vetted agents and verified community members.",
    localSupportTitle: "Local Currency Support",
    localSupportDesc: "Pay in BDT and receive support in your local language and timezone.",
    communityDrivenTitle: "Community-Driven",
    communityDrivenDesc: "Built by migrants, for migrants. Real experiences, real protection.",
    ctaTitle: "Ready to Get Started?",
    ctaSubtitle: "Join thousands of members who trust MigrateSafely for their migration journey",
    joinButton: "Join as a Member",
    learnMoreButton: "Learn More"
  },
  bn: {
    pageTitle: "আমাদের সেবা - MigrateSafely.com",
    metaDescription: "প্রতারণা প্রতিরোধ, যাচাইকো কার্যকলাপ রিপোর্ট করুন, এজেন্টের প্রমাণপত্র যাচাই করুন এবং প্রতারণা থেকে নিজেকে রক্ষা করতে আমাদের ব্যাপক প্রতারণা ব্ল্যাকলিস্ট অ্যাক্সেস করুন।",
    heroTitle: "ব্যাপক অভিবাসন সহায়তা সেবা",
    heroSubtitle: "নিরাপদ এবং সফল অভিবাসন যাত্রার জন্য আপনার প্রয়োজনীয় সবকিছু",
    servicesTitle: "আমাদের মূল সেবাসমূহ",
    scamPreventionTitle: "প্রতারণা প্রতিরোধ এবং রিপোর্টিং",
    scamPreventionDesc: "সন্দেহজনক কার্যকলাপ রিপোর্ট করুন, এজেন্টের প্রমাণপত্র যাচাই করুন এবং প্রতারণা থেকে নিজেকে রক্ষা করতে আমাদের ব্যাপক প্রতারণা ব্ল্যাকলিস্ট অ্যাক্সেস করুন।",
    verifiedAgentsTitle: "যাচাইকৃত এজেন্ট সংযোগ",
    verifiedAgentsDesc: "পূর্ব-যাচাইকৃত, বিশ্বস্ত অভিবাসন এজেন্টদের সাথে সংযোগ করুন যারা আমাদের দল দ্বারা পুঙ্খানুপুঙ্খভাবে যাচাই করা হয়েছে।",
    embassyDirectoryTitle: "দূতাবাস ডিরেক্টরি",
    embassyDirectoryDesc: "আপনার গন্তব্য দেশের জন্য সরকারি দূতাবাস যোগাযোগের তথ্য, ঠিকানা এবং সেবাগুলিতে দ্রুত অ্যাক্সেস।",
    prizeDrawsTitle: "সদস্য পুরস্কার ড্র",
    prizeDrawsDesc: "শুধুমাত্র পেইড সদস্যদের জন্য নিয়মিত পুরস্কার ড্রতে স্বয়ংক্রিয় এন্ট্রি। সম্পূর্ণ বিনামূল্যে - জুয়া বা লটারি নয়।",
    identityVerificationTitle: "পরিচয় যাচাইকরণ",
    identityVerificationDesc: "কমিউনিটির মধ্যে বিশ্বাস তৈরি করতে এবং উন্নত বৈশিষ্ট্যগুলি অ্যাক্সেস করতে ঐচ্ছিক পরিচয় যাচাইকরণ সেবা।",
    ongoingSupportTitle: "চলমান সহায়তা এবং আপডেট",
    ongoingSupportDesc: "আপনার অভিবাসন যাত্রা জুড়ে আপডেট তথ্য, কমিউনিটি সহায়তা এবং সহায়তার ক্রমাগত অ্যাক্সেস।",
    whyChooseTitle: "কেন MigrateSafely বেছে নেবেন?",
    whyChooseSubtitle: "নিরাপদ অভিবাসনে আপনার বিশ্বস্ত অংশীদার",
    comprehensiveTitle: "ব্যাপক সুরক্ষা",
    comprehensiveDesc: "শুরু থেকে শেষ পর্যন্ত নিরাপদ অভিবাসনের প্রতিটি দিক কভার করে অল-ইন-ওয়ান প্ল্যাটফর্ম।",
    verifiedNetworkTitle: "যাচাইকৃত নেটওয়ার্ক",
    verifiedNetworkDesc: "পুঙ্খানুপুঙ্খভাবে যাচাই করা এজেন্ট এবং যাচাইকৃত কমিউনিটি সদস্যদের অ্যাক্সেস।",
    localSupportTitle: "স্থানীয় মুদ্রা সহায়তা",
    localSupportDesc: "BDT-তে পেমেন্ট করুন এবং আপনার স্থানীয় ভাষা এবং টাইমজোনে সহায়তা পান।",
    communityDrivenTitle: "কমিউনিটি-চালিত",
    communityDrivenDesc: "অভিবাসীদের দ্বারা, অভিবাসীদের জন্য নির্মিত। প্রকৃত অভিজ্ঞতা, প্রকৃত সুরক্ষা।",
    ctaTitle: "শুরু করতে প্রস্তুত?",
    ctaSubtitle: "হাজার হাজার সদস্যদের সাথে যোগ দিন যারা তাদের অভিবাসন যাত্রার জন্য MigrateSafely বিশ্বাস করে",
    joinButton: "সদস্য হিসেবে যোগ দিন",
    learnMoreButton: "আরও জানুন"
  }
};

export default function ServicesPage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {t.servicesTitle}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                  <CardTitle>{t.scamPreventionTitle}</CardTitle>
                  <CardDescription>{t.scamPreventionDesc}</CardDescription>
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
                  <Globe className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-4" />
                  <CardTitle>{t.embassyDirectoryTitle}</CardTitle>
                  <CardDescription>{t.embassyDirectoryDesc}</CardDescription>
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
                  <FileCheck className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-4" />
                  <CardTitle>{t.identityVerificationTitle}</CardTitle>
                  <CardDescription>{t.identityVerificationDesc}</CardDescription>
                </CardHeader>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <HeartHandshake className="h-12 w-12 text-pink-600 dark:text-pink-400 mb-4" />
                  <CardTitle>{t.ongoingSupportTitle}</CardTitle>
                  <CardDescription>{t.ongoingSupportDesc}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t.whyChooseTitle}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t.whyChooseSubtitle}
              </p>
            </div>

            {/* Member-Only Teaser */}
            <div className="mb-12">
              <PublicPageTeaser showCTA={false} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.comprehensiveTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.comprehensiveDesc}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.verifiedNetworkTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.verifiedNetworkDesc}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.localSupportTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.localSupportDesc}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-pink-100 dark:bg-pink-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.communityDrivenTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.communityDrivenDesc}
                </p>
              </div>
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
      </div>
    </>
  );
}