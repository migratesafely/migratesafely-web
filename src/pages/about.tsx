import Head from "next/head";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Award, Target, Heart, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TRANSLATIONS = {
  en: {
    pageTitle: "About Us - MigrateSafely.com",
    pageDescription: "Learn about MigrateSafely.com's mission to protect migrants from scams and connect them with verified professionals.",
    heroTitle: "About MigrateSafely.com",
    heroSubtitle: "Connecting Migrants to Verified Professionals",
    heroDescription: "We're building a trusted community where migrants can safely connect with verified agents, access verified scam reports, and receive the support they need for their migration journey.",
    missionTitle: "Our Mission",
    missionDescription: "To protect migrants from scams and fraud by connecting them with verified professionals and providing transparent, community-driven resources.",
    visionTitle: "Our Vision",
    visionDescription: "A world where every person can migrate safely, with access to verified information and trusted professionals.",
    valuesTitle: "Our Core Values",
    value1Title: "Trust & Transparency",
    value1Desc: "We believe in complete transparency. Every agent is verified, every scam report is checked, and every member knows exactly what they're getting.",
    value2Title: "Community Protection",
    value2Desc: "Our community-driven approach means members protect each other by sharing verified scam reports and experiences.",
    value3Title: "Professional Standards",
    value3Desc: "We only connect members with verified professionals who meet our strict standards for credentials and service quality.",
    value4Title: "Member First",
    value4Desc: "Everything we do is designed to protect and empower our members on their migration journey.",
    value5Title: "Innovation",
    value5Desc: "We continuously improve our platform to provide better protection and more valuable resources to our community.",
    value6Title: "Global Reach",
    value6Desc: "Starting in Bangladesh, we're building a global network of verified professionals and protected migrants.",
    whatWeDoTitle: "What We Do",
    feature1Title: "Verified Agent Connections",
    feature1Desc: "We connect members with verified migration agents through a secure, request-based process. No public listings, no unauthorized contact.",
    feature2Title: "Scam Blacklist Database",
    feature2Desc: "Members can access verified scam reports from real victims, check agents before committing, and report scams to protect others.",
    feature3Title: "Member Prize Draws",
    feature3Desc: "Free prize draws exclusively for paid members. No purchase beyond membership required. A membership benefit, not gambling.",
    feature4Title: "Embassy Directory",
    feature4Desc: "Access verified embassy contacts and official government resources for your destination country.",
    howItWorksTitle: "How It Works",
    step1: "Join as a paid member",
    step2: "Request agent connection",
    step3: "We review and match you with verified agents",
    step4: "Connect safely with verified professionals",
    step5: "Access scam reports and community resources",
    step6: "Automatic entry in members-only prize draws",
    whyDifferentTitle: "Why We're Different",
    diff1: "Request-Based: No public agent listings that attract scammers",
    diff2: "Verified Only: Every agent is pre-approved and vetted",
    diff3: "Community-Driven: Real scam reports from real victims",
    diff4: "Transparent: Clear process, clear pricing, clear benefits",
    diff5: "Member Protection: Everything designed to protect you",
    ctaTitle: "Ready to Join?",
    ctaDescription: "Become a member today and access verified professionals, scam protection, and exclusive member benefits.",
    ctaButton: "Join as a Member",
    footerNote: "MigrateSafely.com is a connection platform, not a visa agency. We connect you to verified professionals."
  },
  bn: {
    pageTitle: "আমাদের সম্পর্কে - MigrateSafely.com",
    pageDescription: "MigrateSafely.com এর মিশন সম্পর্কে জানুন যা অভিবাসীদের স্ক্যাম থেকে রক্ষা করে এবং যাচাইকৃত পেশাদারদের সাথে সংযুক্ত করে।",
    heroTitle: "MigrateSafely.com সম্পর্কে",
    heroSubtitle: "যাচাইকৃত পেশাদারদের সাথে অভিবাসীদের সংযুক্ত করা",
    heroDescription: "আমরা একটি বিশ্বস্ত কমিউনিটি তৈরি করছি যেখানে অভিবাসীরা নিরাপদে যাচাইকৃত এজেন্টদের সাথে সংযুক্ত করে পারে, যাচাইকৃত স্ক্যাম রিপোর্ট অ্যাক্সেস করতে পারে এবং তাদের অভিবাসন যাত্রায় রক্ষা এবং ক্ষমতায়নের জন্য ডিজাইন করা হয়েছে।",
    missionTitle: "আমাদের মিশন",
    missionDescription: "অভিবাসীদের স্ক্যাম এবং প্রতারণা থেকে রক্ষা করা যাচাইকৃত পেশাদারদের সাথে সংযুক্ত করে এবং স্বচ্ছ, কমিউনিটি-চালিত সংস্থান প্রদান করে।",
    visionTitle: "আমাদের দৃষ্টি",
    visionDescription: "এমন একটি বিশ্ব যেখানে প্রতিটি ব্যক্তি নিরাপদে মাইগ্রেট করতে পারে, যাচাইকৃত তথ্য এবং বিশ্বস্ত পেশাদারদের অ্যাক্সেস সহ।",
    valuesTitle: "আমাদের মূল মূল্যবোধ",
    value1Title: "বিশ্বাস ও স্বচ্ছতা",
    value1Desc: "আমরা সম্পূর্ণ স্বচ্ছতায় বিশ্বাস করি। প্রতিটি এজেন্ট যাচাই করা হয়, প্রতিটি স্ক্যাম রিপোর্ট পরীক্ষা করা হয় এবং প্রতিটি সদস্য জানেন তারা ঠিক কী পাচ্ছে।",
    value2Title: "কমিউনিটি সুরক্ষা",
    value2Desc: "আমাদের কমিউনিটি-চালিত পদ্ধতির মানে সদস্যরা যাচাইকৃত স্ক্যাম রিপোর্ট এবং অভিজ্ঞতা শেয়ার করে একে অপরকে রক্ষা করে।",
    value3Title: "পেশাদার মান",
    value3Desc: "আমরা শুধুমাত্র যাচাইকৃত পেশাদারদের সাথে সদস্যদের সংযুক্ত করি যারা প্রমাণপত্র এবং সেবা গুণমানের জন্য আমাদের কঠোর মান পূরণ করে।",
    value4Title: "সদস্য প্রথম",
    value4Desc: "আমরা যা কিছু করি তা আমাদের সদস্যদের তাদের অভিবাসন যাত্রায় রক্ষা এবং ক্ষমতায়নের জন্য ডিজাইন করা হয়েছে।",
    value5Title: "উদ্ভাবন",
    value5Desc: "আমরা ক্রমাগত আমাদের প্ল্যাটফর্ম উন্নত করি আমাদের কমিউনিটিকে আরও ভাল সুরক্ষা এবং আরও মূল্যবান সংস্থান প্রদান করতে।",
    value6Title: "বৈশ্বিক পৌঁছানো",
    value6Desc: "বাংলাদেশে শুরু করে, আমরা যাচাইকৃত পেশাদার এবং সুরক্ষিত অভিবাসীদের একটি বৈশ্বিক নেটওয়ার্ক তৈরি করছি।",
    whatWeDoTitle: "আমরা কী করি",
    feature1Title: "যাচাইকৃত এজেন্ট সংযোগ",
    feature1Desc: "আমরা একটি নিরাপদ, অনোধ-ভিত্তিক প্রক্রিয়ার মাধ্যমে যাচাইকৃত মাইগ্রেশন এজেন্টদের সাথে আপনাকে মেলাই",
    feature2Title: "স্ক্যাম ব্ল্যাকলিস্ট ডেটাবেস",
    feature2Desc: "সদস্যরা প্রকৃত ভুক্তভোগীদের থেকে প্রকৃত স্ক্যাম রিপোর্ট অ্যাক্সেস করতে পারে, প্রতিশ্রুতি দেওয়ার আগে এজেন্ট পরীক্ষা করতে পারে এবং অন্যদের রক্ষা করতে স্ক্যাম রিপোর্ট করতে পারে।",
    feature3Title: "সদস্য পুরস্কার ড্র",
    feature3Desc: "পেইড সদস্যদের জন্য বিনামূল্যে পুরস্কার ড্র। সদস্যপদের বাইরে কোনো ক্রয়ের প্রয়োজন নেই। একটি সদস্যপদ সুবিধা, জুয়া নয়।",
    feature4Title: "দূতাবাস ডিরেক্টরি",
    feature4Desc: "আপনার গন্তব্য দেশের জন্য যাচাইকৃত দূতাবাস যোগাযোগ এবং অফিসিয়াল সরকারি সংস্থান অ্যাক্সেস করুন।",
    howItWorksTitle: "এটি কীভাবে কাজ করে",
    step1: "পেইড সদস্য হিসাবে যোগ দিন",
    step2: "এজেন্ট সংযোগ অনুরোধ করুন",
    step3: "আমরা পর্যালোচনা করি এবং যাচাইকৃত এজেন্টদের সাথে আপনাকে মেলাই",
    step4: "যাচাইকৃত পেশাদারদের সাথে নিরাপদে সংযোগ করুন",
    step5: "স্ক্যাম রিপোর্ট এবং কমিউনিটি সংস্থান অ্যাক্সেস করুন",
    step6: "শুধুমাত্র সদস্যদের পুরস্কার ড্রতে স্বয়ংক্রিয় এন্ট্রি",
    whyDifferentTitle: "কেন আমরা আলাদা",
    diff1: "অনোধ-ভিত্তিক: কোনো সর্বজনীন এজেন্ট তালিকা নেই যা স্ক্যামার আকর্ষণ করে",
    diff2: "শুধুমাত্র যাচাইকৃত: প্রতিটি এজেন্ট পূর্ব-অনুমোদিত এবং যাচাই করা",
    diff3: "কমিউনিটি-চালিত: প্রকৃত ভুক্তভোগীদের থেকে প্রকৃত স্ক্যাম রিপোর্ট",
    diff4: "স্বচ্ছ: স্পষ্ট প্রক্রিয়া, স্পষ্ট মূল্য, স্পষ্ট সুবিধা",
    diff5: "সদস্য সুরক্ষা: সবকিছু আপনাকে রক্ষা করার জন্য ডিজাইন করা হয়েছে",
    ctaTitle: "যোগ দিতে প্রস্তুত?",
    ctaDescription: "আজই সদস্য হন এবং যাচাইকৃত পেশাদার, স্ক্যাম সুরক্ষা এবং এক্সক্লুসিভ সদস্য সুবিধা অ্যাক্সেস করুন।",
    ctaButton: "সদস্য হিসাবে যোগ দিন",
    footerNote: "MigrateSafely.com একটি সংযোগ প্ল্যাটফর্ম, ভিসা এজেন্সি নয়। আমরা আপনাকে যাচাইকৃত পেশাদারদের সাথে সংযুক্ত করি।"
  }
};

export default function AboutPage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.pageDescription} />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {t.heroTitle}
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
              {t.heroSubtitle}
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t.heroDescription}
            </p>
          </div>
        </section>

        {/* About Us Image */}
        <section className="py-12 bg-white dark:bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <img 
              src="/images/about-us.png" 
              alt="About MigrateSafely - Our Team and Mission" 
              className="w-full h-auto rounded-lg shadow-lg"
              style={{ maxHeight: "600px", objectFit: "contain" }}
            />
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-8 w-8 text-blue-600" />
                    <CardTitle className="text-2xl">{t.missionTitle}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.missionDescription}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8 text-blue-600" />
                    <CardTitle className="text-2xl">{t.visionTitle}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.visionDescription}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              {t.valuesTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle>{t.value1Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t.value1Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle>{t.value2Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t.value2Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Award className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle>{t.value3Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t.value3Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Heart className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle>{t.value4Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t.value4Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle>{t.value5Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t.value5Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Globe className="h-8 w-8 text-blue-600 mb-3" />
                  <CardTitle>{t.value6Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t.value6Desc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              {t.whatWeDoTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t.feature1Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.feature1Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.feature2Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.feature2Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.feature3Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.feature3Desc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.feature4Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t.feature4Desc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              {t.howItWorksTitle}
            </h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600">1.</span> {t.step1}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600">2.</span> {t.step2}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600">3.</span> {t.step3}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600">4.</span> {t.step4}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600">5.</span> {t.step5}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600">6.</span> {t.step6}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why We're Different */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
              {t.whyDifferentTitle}
            </h2>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-700 dark:text-gray-300">✓ {t.diff1}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-700 dark:text-gray-300">✓ {t.diff2}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-700 dark:text-gray-300">✓ {t.diff3}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-700 dark:text-gray-300">✓ {t.diff4}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-700 dark:text-gray-300">✓ {t.diff5}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-blue-600 dark:bg-blue-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              {t.ctaDescription}
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                {t.ctaButton}
              </Button>
            </Link>
            <p className="text-sm text-blue-200 mt-6">
              {t.footerNote}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}