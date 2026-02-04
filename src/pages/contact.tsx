import Head from "next/head";
import Link from "next/link";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock, MapPin, MessageSquare, Shield, Users, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TRANSLATIONS = {
  en: {
    pageTitle: "Contact Us - MigrateSafely.com",
    metaDescription: "Get in touch with MigrateSafely.com support team for assistance.",
    heroTitle: "Contact Us",
    heroDescription: "Have questions? Need assistance? Our support team is here to help you with your safe migration journey.",
    generalSupportTitle: "General Support",
    generalSupportDescription: "For general inquiries, membership questions, and platform assistance:",
    privacyInquiriesTitle: "Privacy Inquiries",
    privacyInquiriesDescription: "For data protection, privacy concerns, and account deletion requests:",
    agentApplicationsTitle: "Agent Applications",
    agentApplicationsDescription: "For migration agents interested in joining our verified network:",
    support247Title: "24/7 Support",
    support247Description: "Our support team is available 24/7 to assist you.\nNo time zones. No delays.",
    memberSupportTitle: "Member Support Features",
    memberSupportDescription: "Active members have access to additional support channels",
    internalMessagingTitle: "Internal Messaging",
    internalMessagingDescription: "Contact our team directly through the platform's internal messaging system for faster responses.",
    supportTicketsTitle: "Support Tickets",
    supportTicketsDescription: "Submit detailed support tickets from your dashboard with attachments and priority options.",
    requestTrackingTitle: "Request Tracking",
    requestTrackingDescription: "Track your agent requests and communications in real-time through your member dashboard.",
    faqTitle: "Common Questions",
    faq1Title: "How long does it take to get a response?",
    faq1Description: "We aim to respond to all email inquiries within 24-48 business hours. Members using our internal messaging system typically receive faster responses during business hours.",
    faq2Title: "Can I speak to someone on the phone?",
    faq2Description: "Currently, we provide support via email and our internal messaging system. This allows us to provide thorough, documented assistance and maintain records for your reference.",
    faq3Title: "I need help with an agent request. What should I do?",
    faq3Description: "Active members can track their agent requests through their dashboard. For specific questions, contact us via the internal messaging system or email support@migratesafely.com with your request ID.",
    faq4Title: "How do I report a technical issue?",
    faq4Description: "Please email support@migratesafely.com with a detailed description of the issue.",
    beforeContactTitle: "Before You Contact Us",
    beforeContactDescription: "Many common questions are already answered on our website:",
    generalInfoTitle: "General Information:",
    generalInfoItems: [
      "About Us - Who we are",
      "Our Services - What we offer",
      "How It Works - Step-by-step process",
      "Membership - Benefits and pricing",
    ],
    legalPoliciesTitle: "Legal & Policies:",
    legalPoliciesItems: [
      "Terms of Service - Platform rules",
      "Privacy Policy - Data protection",
      "Disclaimer - Important notices",
    ],
    emailLabel: "Email us at:",
    locationLabel: "Location:",
    locationValue: "🇬🇧 Headquarters: London, United Kingdom\n🇧🇩 Sister Concern / Regional Office: Dhaka, Bangladesh",
    messageLabel: "Message us:",
  },
  bn: {
    pageTitle: "যোগাযোগ করুন - MigrateSafely.com",
    metaDescription: "সহায়তার জন্য MigrateSafely.com সাপোর্ট টিমের সাথে যোগাযোগ করুন।",
    heroTitle: "যোগাযোগ করুন",
    heroDescription: "প্রশ্ন আছে? সহায়তা প্রয়োজন? আমাদের সাপোর্ট টিম আপনাকে সাহায্য করার জন্য এখানে আছে।",
    generalSupportTitle: "সাধারণ সহায়তা",
    generalSupportDescription: "সাধারণ অনুসন্ধান, সদস্যপদ প্রশ্ন এবং প্ল্যাটফর্ম সহায়তার জন্য:",
    privacyInquiriesTitle: "গোপনীয়তা অনুসন্ধান",
    privacyInquiriesDescription: "ডেটা সুরক্ষা, গোপনীয়তা উদ্বেগ এবং অ্যাকাউন্ট মুছে ফেলার অনুরোধের জন্য:",
    agentApplicationsTitle: "এজেন্ট আবেদন",
    agentApplicationsDescription: "আমাদের যাচাইকৃত নেটওয়ার্কে যোগ দিতে আগ্রহী অভিবাসন এজেন্টদের জন্য:",
    support247Title: "২৪/৭ সহায়তা",
    support247Description: "আমাদের সাপোর্ট টিম আপনাকে সাহায্য করার জন্য ২৪/৭ উপলব্ধ।\nকোন টাইম জোন নেই। কোন বিলম্ব নেই।",
    memberSupportTitle: "সদস্য সহায়তা বৈশিষ্ট্য",
    memberSupportDescription: "সক্রিয় সদস্যদের অতিরিক্ত সহায়তা চ্যানেলগুলিতে অ্যাক্সেস রয়েছে",
    internalMessagingTitle: "অভ্যন্তরীণ মেসেজিং",
    internalMessagingDescription: "দ্রুত প্রতিক্রিয়ার জন্য প্ল্যাটফর্মের অভ্যন্তরীণ মেসেজিং সিস্টেমে মাধ্যমে সরাসরি আমাদের টিমের সাথে যোগাযোগ করুন।",
    supportTicketsTitle: "সাপোর্ট টিকিট",
    supportTicketsDescription: "আপনার ড্যাশবোর্ড থেকে সংযুক্তি এবং অগ্রাধিকার বিকল্পগুলির সাথে বিস্তারিত সাপোর্ট টিকিট জমা দিন।",
    requestTrackingTitle: "অনুরোধ ট্র্যাকিং",
    requestTrackingDescription: "আপনার সদস্য ড্যাশবোর্ডের মাধ্যমে রিয়েল-টাইমে আপনার এজেন্ট অনোধ এবং যোগাযোগগুলি ট্র্যাক করুন।",
    faqTitle: "সাধারণ প্রশ্ন",
    faq1Title: "প্রতিক্রিয়া পেতে কতক্ষণ সময় লাগে?",
    faq1Description: "আমরা ২৪-৪৮ কর্মঘণ্টার মধ্যে সমস্ত ইমেল অনুসন্ধানের উত্তর দেওয়ার লক্ষ্য রাখি। আমাদের অভ্যন্তরীণ মেসেজিং সিস্টেম ব্যবহারকারী সদস্যরা সাধারণত কর্মঘণ্টার সময় দ্রুত প্রতিক্রিয়া পান।",
    faq2Title: "আমি কি ফোনে কারো সাথে কথা বলতে পারি?",
    faq2Description: "বর্তমানে, আমরা ইমেল এবং আমাদের অভ্যন্তরীণ মেসেজিং সিস্টেমের মাধ্যমে সহায়তা প্রদান করি। এটি আমাদের পুঙ্খানুপুঙ্খ, নথিভুক্ত সহায়তা প্রদান করতে এবং আপনার রেফারেন্সের জন্য রেকর্ড বজায় রাখতে দেয়।",
    faq3Title: "আমার একটি এজেন্ট অনোধে সাহায্য দরকার। আমার কি করা উচিত?",
    faq3Description: "সক্রিয় সদস্যরা তাদের ড্যাশবোর্ডের মাধ্যমে তাদের এজেন্ট অনোধগুলি ট্র্যাক করতে পারেন। নির্দিষ্ট প্রশ্নের জন্য, অভ্যন্তরীণ মেসেজিং সিস্টেমের মাধ্যমে আমাদের সাথে যোগাযোগ করুন বা আপনার অনুরোধ আইডি সহ support@migratesafely.com এ ইমেল করুন।",
    faq4Title: "আমি কীভাবে একটি প্রযুক্তিগত সমস্যা রিপোর্ট করব?",
    faq4Description: "অনুগ্রহ করে সমস্যার বিস্তারিত বিবরণ সহ support@migratesafely.com এ ইমেল করুন।",
    beforeContactTitle: "আমাদের সাথে যোগাযোগ করার আগে",
    beforeContactDescription: "অনেক সাধারণ প্রশ্নের উত্তর ইতিমধ্যে আমাদের ওয়েবসাইটে দেওয়া আছে:",
    generalInfoTitle: "সাধারণ তথ্য:",
    generalInfoItems: [
      "আমাদের সম্পর্কে - আমরা কে",
      "আমাদের সেবা - আমরা কি অফার করি",
      "কিভাবে কাজ করে - ধাপে ধাপে প্রক্রিয়া",
      "সদস্যপদ - সুবিধা এবং মূল্য",
    ],
    legalPoliciesTitle: "আইনি এবং নীতি:",
    legalPoliciesItems: [
      "পরিষেবার শর্তাবলী - প্ল্যাটফর্ম নিয়ম",
      "গোপনীয়তা নীতি - ডেটা সুরক্ষা",
      "দাবিত্যাগ - গুরুত্বপূর্ণ বিজ্ঞপ্তি",
    ],
    emailLabel: "আমাদের ইমেল করুন:",
    locationLabel: "অবস্থান:",
    locationValue: "🇬🇧 সদর দুন যুক্তরাজ্য\n🇧🇩 সিস্টার কনসার্ন / আঞ্চলিক অফিস: ঢাকা, বাংলাদেশ",
    messageLabel: "আমাদের মেসেজ করুন:",
  }
};

export default function Contact() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>

      <MainHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t.heroTitle}</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              {t.heroDescription}
            </p>
          </div>
        </section>

        {/* Contact Support Image */}
        <section className="py-8 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-4xl">
            <img 
              src="/images/contact-support.png" 
              alt="Contact Support Team" 
              className="w-full h-auto rounded-lg shadow-lg mx-auto object-contain"
              style={{ maxHeight: "384px", objectPosition: "top center" }}
            />
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-6xl">
          
          {/* Main Contact Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* General Support */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>{t.generalSupportTitle}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t.generalSupportDescription}
                </p>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold">{t.emailLabel}</span>
                  <a href="mailto:support@migratesafely.com" className="text-blue-600 hover:underline text-lg">
                    support@migratesafely.com
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* 24/7 Support */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2 justify-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-center">{t.support247Title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                 <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line text-lg">
                  {t.support247Description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Privacy */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <Shield className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t.privacyInquiriesTitle}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {t.privacyInquiriesDescription}
              </p>
              <a href="mailto:privacy@migratesafely.com" className="text-blue-600 hover:underline text-sm font-medium">
                privacy@migratesafely.com
              </a>
            </div>

            {/* Agent Applications */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <Users className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t.agentApplicationsTitle}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {t.agentApplicationsDescription}
              </p>
              <Link href="/agents/apply" className="text-blue-600 hover:underline text-sm font-medium">
                Apply as Agent &rarr;
              </Link>
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <MapPin className="h-8 w-8 text-gray-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t.locationLabel}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                {t.locationValue}
              </p>
            </div>
          </div>

          {/* Member Support Features */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">{t.memberSupportTitle}</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t.memberSupportDescription}
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t.internalMessagingTitle}</h3>
                <p className="text-sm text-gray-500">{t.internalMessagingDescription}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t.supportTicketsTitle}</h3>
                <p className="text-sm text-gray-500">{t.supportTicketsDescription}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{t.requestTrackingTitle}</h3>
                <p className="text-sm text-gray-500">{t.requestTrackingDescription}</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">{t.faqTitle}</h2>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-2">
                    {t[`faq${num}Title` as keyof typeof t]}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t[`faq${num}Description` as keyof typeof t]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Before You Contact */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">{t.beforeContactTitle}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.beforeContactDescription}
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">{t.generalInfoTitle}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    {(t.generalInfoItems as string[]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">{t.legalPoliciesTitle}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                    {(t.legalPoliciesItems as string[]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
               <img 
                 src="/images/about-us.png" 
                 alt="MigrateSafely Support" 
                 className="rounded-xl shadow-lg w-full object-cover" 
                 style={{maxHeight: "400px"}}
               />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}