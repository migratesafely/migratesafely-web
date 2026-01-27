import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Award, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

const TRANSLATIONS = {
  en: {
    // Meta
    pageTitle: "MigrateSafely.com - Safer Migration Starts Here | Verified Visa Agents Bangladesh",
    pageDescription: "Connect with verified migration agents, access verified scam reports, and join a trusted community. We help you migrate safely by connecting you to verified professionals.",
    
    // Hero
    heroTitle: "MigrateSafely.com",
    heroSubtitle: "Safer Migration Starts Here",
    heroDescription: "Connect with verified migration agents, access verified scam reports, and join a trusted community helping people migrate safely.",
    heroLaunchNote: "🇧🇩 Launching in Bangladesh first — expanding soon.",
    heroCtaPrimary: "Join as a Member",
    heroCtagSecondary: "Member Login",
    heroMembershipNote: "Membership fee applies (country-based pricing). Prize draws are free for active members.",
    
    // Why We Exist
    whyTitle: "Why We Exist",
    whyDescription: "Every year, thousands of people fall victim to migration scams, losing their life savings to fake agents and fraudulent visa services.",
    problemTitle: "The Problem",
    problemItems: ["Fake migration agents", "Fraudulent visa promises", "Life savings lost", "No accountability", "Difficult to verify credentials"],
    impactTitle: "The Impact",
    impactItems: ["Families separated", "Dreams shattered", "Financial devastation", "Trust destroyed", "Legal complications"],
    solutionTitle: "Our Solution",
    solutionItems: ["Verified agent connections", "Scam blacklist database", "Community protection", "Transparent process", "Safe migration support"],
    
    // What We Do
    whatTitle: "What We Do",
    whatDescription: "We connect members to verified and approved migration agents after request and approval. We do NOT publicly list agents to prevent unauthorized contact and maintain quality control.",
    approachTitle: "Our Approach",
    approachItems: [
      { title: "Request-Based Connection:", desc: "Members submit agent requests describing their needs" },
      { title: "Manual Review:", desc: "Our team reviews each request and matches with suitable verified agents" },
      { title: "Verified Agents Only:", desc: "Only pre-approved, vetted agents are assigned to member requests" },
      { title: "Secure Process:", desc: "All connections are tracked and monitored for member safety" }
    ],
    dontDoTitle: "What We DON'T Do",
    dontDoItems: [
      { title: "No Public Agent Listings:", desc: "Agents are not publicly searchable or listed" },
      { title: "No Direct Solicitation:", desc: "Agents cannot contact members without assignment" },
      { title: "No Visa Guarantees:", desc: "We connect you to professionals, but don't guarantee visa outcomes" },
      { title: "Not a Visa Agency:", desc: "We are a connection platform, not a visa processing service" }
    ],
    
    // Benefits
    benefitsTitle: "Member Benefits",
    benefitsDescription: "Join our community and access exclusive features designed to protect and support your migration journey.",
    benefit1Title: "Verified Agent Connection",
    benefit1Desc: "Submit requests and get matched with verified, approved migration agents through our secure review process.",
    benefit2Title: "Scam Blacklist",
    benefit2Desc: "Access verified scam reports from real victims. Check agents before you commit. Report scams to protect others.",
    benefit3Title: "Members-Only Prize Draws",
    benefit3Desc: "Completely free prize draws for active paid members. No tickets can be purchased, no additional payment required beyond membership. This is a membership benefit, not a lottery or gambling service.",
    benefit4Title: "Embassy Directory",
    benefit4Desc: "Find official embassy contacts for your country. Access verified government resources and official links.",
    
    // Disclaimer
    disclaimerTitle: "Important Disclaimer",
    disclaimerSubtitle: "We are NOT a visa agency. We only connect you to verified professionals.",
    disclaimerItems: [
      "Connection Platform: We facilitate connections between members and verified agents",
      "No Visa Guarantees: Visa outcomes depend on your case, documentation, and government decisions",
      "Independent Professionals: Agents operate independently; we verify credentials but don't control their services",
      "Due Diligence Required: Always verify agent credentials, contracts, and fees before proceeding",
      "Official Resources: Use our embassy directory to access official government immigration information"
    ],
    disclaimerNote: "MigrateSafely.com helps you make informed decisions, but the ultimate responsibility for your migration journey rests with you and the professionals you choose to work with.",
    disclaimerCta: "Join as a Member",
    
    // Compliance
    complianceTitle: "Bangladesh Business Registration",
    complianceLicense: "Trade License No:",
    complianceExpiry: "Trade License Expiry:",
    complianceTin: "TIN:",
    complianceRegNo: "Company Registration No:",
    complianceCountry: "Operating Country:",
    complianceNote: "MigrateSafely.com is a membership platform that connects users to verified migration support services. We do not issue visas or make government decisions.",
    complianceAvailability: "Currently available in Bangladesh. New countries will be announced before launch.",
    
    // Footer
    footerTagline: "Connecting people to verified migration professionals through a secure, request-based process.",
    footerQuickLinks: "Quick Links",
    footerAbout: "About Us",
    footerWinners: "Prize Draw Winners",
    footerEmbassy: "Embassy Directory",
    footerSignup: "Sign Up",
    footerLogin: "Login",
    footerMemberResources: "Member Resources",
    footerDashboard: "Member Dashboard",
    footerRequestAgent: "Request Agent Connection",
    footerScamReports: "Scam Reports",
    footerPrizeDraw: "Prize Draws",
    footerCopyright: "All rights reserved.",
    footerNote: "Not a visa agency. We connect members to verified professionals only."
  },
  bn: {
    // Meta
    pageTitle: "MigrateSafely.com - নিরাপদ অভিবাসন এখানে শুরু হয় | যাচাইকৃত মাইগ্রেশন এজেন্ট বাংলাদেশ",
    pageDescription: "যাচাইকৃত মাইগ্রেশন এজেন্টদের সাথে সংযুক্ত হন, যাচাইকৃত স্ক্যাম রিপোর্ট অ্যাক্সেস করুন এবং একটি বিশ্বস্ত কমিউনিটিতে যোগ দিন। আমরা আপনাকে যাচাইকৃত পেশাদারদের সাথে সংযুক্ত করে নিরাপদভাবে মাইগ্রেট করতে সাহায্য করি।",
    
    // Hero
    heroTitle: "MigrateSafely.com",
    heroSubtitle: "নিরাপদ অভিবাসন এখানে শুরু হয়",
    heroDescription: "যাচাইকৃত মাইগ্রেশন এজেন্টদের সাথে সংযুক্ত হন, যাচাইকৃত স্ক্যাম রিপোর্ট অ্যাক্সেস করুন এবং মানুষকে নিরাপদে মাইগ্রেট করতে সাহায্য করা একটি বিশ্বস্ত কমিউনিটিতে যোগ দিন।",
    heroLaunchNote: "🇧🇩 প্রথমে বাংলাদেশে চালু হচ্ছে — শীঘ্রই সম্প্রসারণ হবে।",
    heroCtaPrimary: "সদস্য হিসেবে যোগ দিন",
    heroCtagSecondary: "সদস্য লগইন",
    heroMembershipNote: "সদস্যপদ ফি প্রযোজ্য (দেশ-ভিত্তিক মূল্য)। সক্রিয় সদস্যদের জন্য পুরস্কার ড্র বিনামূল্যে পুরস্কার ড্র বিনামূল্যে।",
    
    // Why We Exist
    whyTitle: "কেন আমরা আছি",
    whyDescription: "প্রতি বছর হাজার হাজার মানুষ মাইগ্রেশন স্ক্যামের শিকার হয়, জাল এজেন্ট এবং প্রতারণামূলক ভিসা প্রতিশ্রুতি যাচাই করা কঠিন।",
    problemTitle: "সমস্যা",
    problemItems: ["জাল মাইগ্রেশন এজেন্ট", "প্রতারণামূলক ভিসা প্রতিশ্রুতি", "সারাজীবনের সঞ্চয় হারানো", "কোনো জবাবদিহিতা নেই", "প্রমাণপত্র যাচাই করা কঠিন"],
    impactTitle: "প্রভাব",
    impactItems: ["পরিবার বিচ্ছিন্ন", "স্বপ্ন ভেঙে যাওয়া", "আর্থিক বিপর্যয়", "বিশ্বাস ধ্বংস", "আইনি জটিলতা"],
    solutionTitle: "আমাদের সমাধান",
    solutionItems: ["যাচাইকৃত এজেন্ট সংযোগ", "স্ক্যাম ব্ল্যাকলিস্ট ডেটাবেস", "কমিউনিটি সুরক্ষা", "স্বচ্ছ প্রক্রিয়া", "নিরাপদ মাইগ্রেশন সহায়তা"],
    
    // What We Do
    whatTitle: "আমরা কী করি",
    whatDescription: "আমরা অনুরোধ এবং অনুমোদনের পরে সদস্যদের যাচাইকৃত এবং অনুমোদিত মাইগ্রেশন এজেন্টদের সাথে সংযুক্ত করি। অননুমোদিত যোগাযোগ রোধ করতে এবং গুণমান নিয়ন্ত্রণ বজায় রাখতে আমরা এজেন্টদের সর্বজনীনভাবে তালিকাভুক্ত করি না।",
    approachTitle: "আমাদের পদ্ধতি",
    approachItems: [
      { title: "অনোধ-ভিত্তিক সংযোগ:", desc: "সদস্যরা তাদের প্রয়োজন বর্ণনা করে এজেন্ট অনোধ জমা দেন" },
      { title: "ম্যানুয়াল পর্যালোচনা:", desc: "আমাদের টিম প্রতিটি অনোধ পর্যালোচনা করে এবং উপযুক্ত যাচাইকৃত এজেন্টদের সাথে মিল করে" },
      { title: "শুধুমাত্র যাচাইকৃত এজেন্ট:", desc: "শুধুমাত্র পূর্ব-অনুমোদিত, যাচাইকৃত এজেন্টদের সদস্য অনোধে নিয়োগ দেওয়া হয়" },
      { title: "নিরাপদ প্রক্রিয়া:", desc: "সদস্য নিরাপত্তার জন্য সমস্ত সংযোগ ট্র্যাক এবং পর্যবেক্ষণ করা হয়" }
    ],
    dontDoTitle: "আমরা কী করি না",
    dontDoItems: [
      { title: "কোনো সর্বজনীন এজেন্ট তালিকা নেই:", desc: "এজেন্টরা সর্বজনীনভাবে অনুসন্ধানযোগ্য বা তালিকাভুক্ত নয়" },
      { title: "কোনো সরাসরি অনুরোধ নেই:", desc: "এজেন্টরা নিয়োগ ছাড়া সদস্যদের সাথে যোগাযোগ করতে পারে না" },
      { title: "কোনো ভিসা গ্যারান্টি নেই:", desc: "আমরা আপনাকে পেশাদারদের সাথে সংযুক্ত করি, কিন্তু ভিসা ফলাফলের গ্যারান্টি দিই না" },
      { title: "ভিসা এজেন্সি নয়:", desc: "আমরা একটি সংযোগ প্ল্যাটফর্ম, ভিসা প্রক্রিয়াকরণ সেবা নই" }
    ],
    
    // Benefits
    benefitsTitle: "সদস্য সুবিধা",
    benefitsDescription: "আমাদের কমিউনিটিতে যোগ দিন এবং আপনার মাইগ্রেশন যাত্রা রক্ষা এবং সমর্থন করার জন্য ডিজাইন করা এক্সক্লুসিভ বৈশিষ্ট্যগুলি অ্যাক্সেস করুন।",
    benefit1Title: "যাচাইকৃত এজেন্ট সংযোগ",
    benefit1Desc: "অনুরোধ জমা দিন এবং আমাদের নিরাপদ পর্যালোচনা প্রক্রিয়ার মাধ্যমে যাচাইকৃত, অনুমোদিত মাইগ্রেশন এজেন্টদের সাথে মিলিত হন।",
    benefit2Title: "স্ক্যাম ব্ল্যাকলিস্ট",
    benefit2Desc: "প্রকৃত ভুক্তভোগীদের থেকে যাচাইকৃত স্ক্যাম রিপোর্ট অ্যাক্সেস করুন। প্রতিশ্রুতি দেওয়ার আগে এজেন্ট পরীক্ষা করুন। অন্যদের রক্ষা করতে স্ক্যাম রিপোর্ট করুন।",
    benefit3Title: "শুধুমাত্র সদস্যদের জন্য পুরস্কার ড্র",
    benefit3Desc: "সক্রিয় পেইড সদস্যদের জন্য সম্পূর্ণ বিনামূল্যে পুরস্কার ড্র। কোনো টিকিট কেনা যায় না, সদস্যপদের বাইরে কোনো অতিরিক্ত পেমেন্টের প্রয়োজন নেই। এটি একটি সদস্যপদ সুবিধা, লটারি বা জুয়া সেবা নয়।",
    benefit4Title: "দূতাবাস ডিরেক্টরি",
    benefit4Desc: "আপনার দেশের জন্য অফিসিয়াল দূতাবাস যোগাযোগ খুঁজুন। যাচাইকৃত সরকারি সংস্থান এবং অফিসিয়াল লিঙ্ক অ্যাক্সেস করুন।",
    
    // Disclaimer
    disclaimerTitle: "গুরুত্বপূর্ণ দাবিত্যাগ",
    disclaimerSubtitle: "আমরা একটি ভিসা এজেন্সি নই। আমরা শুধুমাত্র আপনাকে যাচাইকৃত পেশাদারদের সাথে সংযুক্ত করি।",
    disclaimerItems: [
      "সংযোগ প্ল্যাটফর্ম: আমরা সদস্য এবং যাচাইকৃত এজেন্টদের মধ্যে সংযোগ সহজতর করি",
      "কোনো ভিসা গ্যারান্টি নেই: ভিসা ফলাফল আপনার কেস, ডকুমেন্টেশন এবং সরকারি সিদ্ধান্তের উপর নির্ভর করে",
      "স্বাধীন পেশাদার: এজেন্টরা স্বাধীনভাবে কাজ করে; আমরা প্রমাণপত্র যাচাই করি কিন্তু তাদের সেবা নিয়ন্ত্রণ করি না",
      "যথাযথ পরিশ্রম প্রয়োজন: এগিয়ে যাওয়ার আগে সর্বদা এজেন্ট প্রমাণপত্র, চুক্তি এবং ফি যাচাই করুন",
      "অফিসিয়াল সংস্থান: অফিসিয়াল সরকারি ইমিগ্রেশন তথ্য অ্যাক্সেস করতে আমাদের দূতাবাস ডিরেক্টরি ব্যবহার করুন"
    ],
    disclaimerNote: "MigrateSafely.com আপনাকে অবগত সিদ্ধান্ত নিতে সাহায্য করে, কিন্তু আপনার মাইগ্রেশন যাত্রার চূড়ান্ত দায়িত্ব আপনার এবং আপনি যে পেশাদারদের সাথে কাজ করতে বেছে নেন তাদের উপর নির্ভর করে।",
    disclaimerCta: "সদস্য হিসেবে যোগ দিন",
    
    // Compliance
    complianceTitle: "বাংলাদেশ ব্যবসা নিবন্ধন",
    complianceLicense: "ট্রেড লাইসেন্স নং:",
    complianceExpiry: "ট্রেড লাইসেন্স মেয়াদ শেষ:",
    complianceTin: "টিআইএন:",
    complianceRegNo: "কোম্পানি নিবন্ধন নং:",
    complianceCountry: "পরিচালনার দেশ:",
    complianceNote: "MigrateSafely.com একটি সদস্যপদ প্ল্যাটফর্ম যা ব্যবহারকারীদের যাচাইকৃত মাইগ্রেশন সহায়তা সেবার সাথে সংযুক্ত করে। আমরা ভিসা ইস্যু করি না বা সরকারি সিদ্ধান্ত নিই না।",
    complianceAvailability: "বর্তমানে বাংলাদেশে উপলব্ধ। নতুন দেশ চালু হওয়ার আগে ঘোষণা করা হবে।",
    
    // Footer
    footerTagline: "নিরাপদ, অনুরোধ-ভিত্তিক প্রক্রিয়ার মাধ্যমে যাচাইকৃত মাইগ্রেশন পেশাদারদের সাথে মানুষকে সংযুক্ত করা।",
    footerQuickLinks: "দ্রুত লিঙ্ক",
    footerAbout: "আমাদের সম্পর্কে",
    footerWinners: "পুরস্কার ড্র বিজয়ীরা",
    footerEmbassy: "দূতাবাস ডিরেক্টরি",
    footerSignup: "সাইন আপ",
    footerLogin: "লগইন",
    footerMemberResources: "সদস্য সংস্থান",
    footerDashboard: "সদস্য ড্যাশবোর্ড",
    footerRequestAgent: "এজেন্ট সংযোগ অনুরোধ করুন",
    footerScamReports: "স্ক্যাম রিপোর্ট",
    footerPrizeDraw: "পুরস্কার ড্র",
    footerCopyright: "সর্বস্বত্ব সংরক্ষিত।",
    footerNote: "ভিসা এজেন্সি নয়। আমরা শুধুমাত্র যাচাইকৃত পেশাদারদের সাথে সদস্যদের সংযুক্ত করি।"
  }
};

export default function HomePage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];
  
  const [complianceSettings, setComplianceSettings] = useState<{
    trade_license_no: string;
    trade_license_expiry: string | null;
    tin_no: string | null;
    company_registration_no: string | null;
    display_on_home: boolean;
  } | null>(null);

  useEffect(() => {
    // Fetch compliance settings for public display
    const fetchComplianceSettings = async () => {
      try {
        const response = await fetch("/api/admin/compliance-settings");
        if (response.ok) {
          const data = await response.json();
          if (data.display_on_home) {
            setComplianceSettings(data);
          }
        }
      } catch (error) {
        console.error("Failed to load compliance settings:", error);
      }
    };

    fetchComplianceSettings();
  }, []);

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.pageDescription} />
        <meta name="keywords" content="migrate safely, migratesafely.com, safe migration platform, Bangladesh migration support, verified visa agents, trusted migration agents, connect with verified agents, approved visa consultant, work visa support Bangladesh, student visa support Bangladesh, visa scam prevention, report scam agent, scam blacklist database, migration fraud prevention, embassy contact directory, immigration resources Bangladesh, licensed migration agent signup, manpower license verification, free member prize draw, membership benefit rewards program" />
        
        {/* Open Graph */}
        <meta property="og:title" content={t.pageTitle} />
        <meta property="og:description" content={t.pageDescription} />
        <meta property="og:url" content="https://migratesafely.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t.pageTitle} />
        <meta name="twitter:description" content={t.pageDescription} />
        <meta name="twitter:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://migratesafely.com/" />
      </Head>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .hero-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .hero-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .hero-float,
          .hero-fade-in {
            animation: none;
          }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        <AppHeader />

        {/* Language Selector Section - Between Header and Hero */}
        <section className="py-4 bg-white dark:bg-gray-900">
          <div className="flex justify-center">
            <LanguageSelector />
          </div>
        </section>

        {/* Hero Image - Full Width */}
        <section className="w-full bg-white dark:bg-gray-900 pt-4 pb-4">
          <div className="w-full">
            <img 
              src="/images/homepage-hero.png" 
              alt="MigrateSafely - Safe migration starts here" 
              className="w-full h-auto object-contain"
              style={{ maxHeight: "80vh", objectPosition: "top center" }}
            />
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-20 relative overflow-hidden" style={{backgroundImage: "url('/images/banner-bg.svg')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left space-y-6 hero-fade-in">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100">
                  {t.heroTitle}
                </h1>
                <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300">
                  {t.heroSubtitle}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {t.heroDescription}
                </p>
                <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mt-2">
                  {t.heroLaunchNote}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Link href="/signup">
                    <Button size="lg" className="text-lg px-8 py-6">
                      {t.heroCtaPrimary}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                      {t.heroCtagSecondary}
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  {t.heroMembershipNote}
                </p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <img 
                  src="/images/hero.svg" 
                  alt="Safe migration and global travel" 
                  className="w-full max-w-lg h-auto hero-float"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why We Exist */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t.whyTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                {t.whyDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">{t.problemTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    {t.problemItems.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600 dark:text-orange-400">{t.impactTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    {t.impactItems.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400">{t.solutionTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    {t.solutionItems.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Shield className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t.whatTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                {t.whatDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {t.approachTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                    {t.approachItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span><strong>{item.title}:</strong> {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    {t.dontDoTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                    {t.dontDoItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">✗</span>
                        <span><strong>{item.title}:</strong> {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t.benefitsTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                {t.benefitsDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <img 
                      src="/images/agent-request.svg" 
                      alt="Verified agents" 
                      className="w-24 h-24"
                    />
                  </div>
                  <CardTitle>{t.benefit1Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {t.benefit1Desc}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <img 
                      src="/images/scam-report.svg" 
                      alt="Scam protection" 
                      className="w-24 h-24"
                    />
                  </div>
                  <CardTitle>{t.benefit2Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {t.benefit2Desc}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <img 
                      src="/images/prize-draw.svg" 
                      alt="Prize draws" 
                      className="w-24 h-24"
                    />
                  </div>
                  <CardTitle>{t.benefit3Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {t.benefit3Desc}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <img 
                      src="/images/embassy.svg" 
                      alt="Embassy directory" 
                      className="w-24 h-24"
                    />
                  </div>
                  <CardTitle>{t.benefit4Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {t.benefit4Desc}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust & Disclaimer */}
        <section className="py-16 bg-blue-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-center text-2xl">{t.disclaimerTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-lg">
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 text-center mb-4">
                    {t.disclaimerSubtitle}
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    {t.disclaimerItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-center pt-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t.disclaimerNote}
                  </p>
                  <Link href="/signup">
                    <Button size="lg" className="text-lg px-8">
                      {t.disclaimerCta}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bangladesh Business Registration */}
        {complianceSettings && (
          <section className="py-12 bg-gray-100 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="border-2 border-gray-300 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-center text-xl">{t.complianceTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                      <p className="text-lg">
                        <strong>{t.complianceLicense}</strong>{" "}
                        {complianceSettings.trade_license_no === "PENDING" 
                          ? "Pending update" 
                          : complianceSettings.trade_license_no}
                      </p>
                      {complianceSettings.trade_license_expiry && (
                        <p className="text-lg">
                          <strong>{t.complianceExpiry}</strong>{" "}
                          {new Date(complianceSettings.trade_license_expiry).toLocaleDateString()}
                        </p>
                      )}
                      {complianceSettings.tin_no && (
                        <p className="text-lg">
                          <strong>{t.complianceTin}</strong>{" "}
                          {complianceSettings.tin_no === "PENDING" 
                            ? "Pending update" 
                            : complianceSettings.tin_no}
                        </p>
                      )}
                      {complianceSettings.company_registration_no && (
                        <p className="text-lg">
                          <strong>{t.complianceRegNo}</strong>{" "}
                          {complianceSettings.company_registration_no === "PENDING" 
                            ? "Pending update" 
                            : complianceSettings.company_registration_no}
                        </p>
                      )}
                      <p className="text-lg">
                        <strong>{t.complianceCountry}</strong> Bangladesh
                      </p>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.complianceNote}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {t.complianceAvailability}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">{t.footerTagline}</h3>
                <p className="text-sm">
                  {t.footerTagline}
                </p>
              </div>

              <div>
                <h3 className="text-white font-semibold text-lg mb-4">{t.footerQuickLinks}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className="hover:text-white">{t.footerAbout}</Link></li>
                  <li><Link href="/winners" className="hover:text-white">{t.footerWinners}</Link></li>
                  <li><Link href="/embassy-directory" className="hover:text-white">{t.footerEmbassy}</Link></li>
                  <li><Link href="/signup" className="hover:text-white">{t.footerSignup}</Link></li>
                  <li><Link href="/login" className="hover:text-white">{t.footerLogin}</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold text-lg mb-4">{t.footerMemberResources}</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/dashboard" className="hover:text-white">{t.footerDashboard}</Link></li>
                  <li><Link href="/request-agent" className="hover:text-white">{t.footerRequestAgent}</Link></li>
                  <li><Link href="/scam-reports" className="hover:text-white">{t.footerScamReports}</Link></li>
                  <li><Link href="/prize-draw" className="hover:text-white">{t.footerPrizeDraw}</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
              <p>&copy; {new Date().getFullYear()} MigrateSafely.com. {t.footerCopyright}</p>
              <p className="mt-2 text-gray-500">
                {t.footerNote}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}