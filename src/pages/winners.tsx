import React from "react";
import Head from "next/head";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart, Shield, Globe, FileCheck, CreditCard } from "lucide-react";

const TRANSLATIONS = {
  en: {
    title: "Prize Draw Winners",
    metaDescription: "Prize draw winners and community support awards",
    subtitle: "Celebrating our community members who won prizes in completed draws.",
    purposeTitle: "Purpose of Community Prize Draws",
    purposeBullet1: "Prize draws are designed exclusively to support existing registered members of Migratesafely.",
    purposeBullet2: "Prize funds are intended to help members with legitimate migration-related costs, including documentation, applications, travel, and settlement expenses.",
    purposeBullet3: "Prize draws are a community benefit program and are NOT a gambling activity or lottery product.",
    eligibilityTitle: "Eligibility & Compliance Rules",
    eligibilityBullet1: "Prize draws are open to eligible Bangladeshi members worldwide, including Non-Resident Bangladeshis (NRBs).",
    eligibilityBullet2: "Members may reside in any country but must be Bangladeshi citizens.",
    eligibilityBullet3: "Identity verification requires either:",
    eligibilityBullet3a: "A valid Bangladeshi Passport OR",
    eligibilityBullet3b: "A Bangladeshi National ID (NID)",
    paymentTitle: "Payment & Verification Rules",
    paymentBullet1: "Prize winnings are NOT paid in physical cash.",
    paymentBullet2: "All approved prizes are paid ONLY via verified bank transfer.",
    paymentBullet3: "The bank account must be a Bangladeshi bank account held in the member's own name.",
    paymentBullet4: "No third-party accounts are permitted.",
    howWinnersTitle: "How Winners Are Selected",
    randomPrizes: "Random Draw Prizes:",
    randomPrizesDesc: "Selected randomly from eligible paid members using secure systems.",
    communityAwards: "Community Support Awards:",
    communityAwardsDesc: "Awarded based on verified hardship cases.",
    privacyNote: "Winner names may be partially masked to protect privacy.",
    prizeLimitsTitle: "Prize Limits & Award Structure",
    prizeLimitsIntro: "To ensure fairness, transparency, and long-term sustainability, Migratesafely.com applies the following prize guidelines:",
    maxPrize: "The maximum first prize in any single draw will not exceed BDT 2,000,000 (20 lakh).",
    variablePrizes: "The number of prizes awarded (first, second, third, or additional community awards) may vary depending on active paid membership levels during the draw period.",
    notLottery: "Prize draws are designed as a community benefit and are not a lottery or gambling product.",
    funding: "All prizes are funded from operational surplus and community initiatives, not from individual member contributions.",
    announcement: "Final prize structures are announced before each draw.",
    complianceNotice: "Prize draws are a member benefit and are not a gambling product. Participation is free for registered members."
  },
  bn: {
    title: "পুরস্কার ড্র বিজয়ীরা",
    metaDescription: "পুরস্কার ড্র বিজয়ী এবং সম্প্রদায় সহায়তা পুরস্কার",
    subtitle: "সমাপ্ত ড্রতে পুরস্কার জিতেছেন এমন আমাদের সম্প্রদায়ের উদযাপন করছি।",
    purposeTitle: "পুরস্কার ড্রয়ের উদ্দেশ্য",
    purposeBullet1: "MigrateSafely-তে সমস্ত পুরস্কার ড্র শুধুমাত্র নিবন্ধিত সদস্যদের জন্য ডিজাইন করা হয়েছে।",
    purposeBullet2: "এই পুরস্কারগুলি সদস্যদের বৈধ মাইগ্রেশন-সম্পর্কিত খরচ, যেমন ডকুমেন্টেশন, আবেদন, ভ্রমণ এবং বসতি স্থাপনের খরচের জন্য তহবিল ব্যবহার করতে সাহায্য করার উদ্দেশ্যে।",
    purposeBullet3: "পুরস্কার ড্র একটি সম্প্রদায় সুবিধা প্রোগ্রাম এবং এটি জুয়া কার্যকলাপ বা লটারি পণ্য নয়।",
    eligibilityTitle: "যোগ্যতা এবং সম্মতি নিয়ম",
    eligibilityBullet1: "পুরস্কার ড্র বিশ্বব্যাপী যোগ্য বাংলাদেশী সদস্যদের জন্য খোলা, যার মধ্যে অনাবাসী বাংলাদেশীরা (NRBs) অন্তর্ভুক্ত।",
    eligibilityBullet2: "সদস্যরা যেকোনো দেশে বসবাস করতে পারেন তবে অবশ্যই বাংলাদেশী নাগরিক হতে হবে।",
    eligibilityBullet3: "পরিচয় যাচাইকরণের জন্য নিম্নলিখিতগুলির মধ্যে একটি প্রয়োজন:",
    eligibilityBullet3a: "একটি বৈধ বাংলাদেশী পাসপোর্ট অথবা",
    eligibilityBullet3b: "একটি বাংলাদেশী জাতীয় পরিচয়পত্র (NID)",
    paymentTitle: "পেমেন্ট এবং যাচাইকরণ নিয়ম",
    paymentBullet1: "পুরস্কার জয় ভৌত নগদে প্রদান করা হয় না।",
    paymentBullet2: "সমস্ত অনুমোদিত পুরস্কার শুধুমাত্র যাচাইকৃত ব্যাংক স্থানান্তরের মাধ্যমে প্রদান করা হয়।",
    paymentBullet3: "ব্যাংক অ্যাকাউন্ট অবশ্যই সদস্যের নিজের নামে একটি বাংলাদেশী ব্যাংক অ্যাকাউন্ট হতে হবে।",
    paymentBullet4: "কোনো তৃতীয় পক্ষের অ্যাকাউন্ট অনুমোদিত নয়।",
    howWinnersTitle: "বিজয়ীরা কিভাবে নির্বাচিত হয়",
    randomPrizes: "র্যান্ডম ড্র পুরস্কার:",
    randomPrizesDesc: "সুরক্ষিত সিস্টেম ব্যবহার করে যোগ্য পেইড সদস্যদের থেকে এলোমেলোভাবে নির্বাচিত।",
    communityAwards: "সম্প্রদায় সহায়তা পুরস্কার:",
    communityAwardsDesc: "যাচাইকৃত কষ্টের ক্ষেত্রে প্রদান করা হয়।",
    privacyNote: "গোপনীয়তা রক্ষার জন্য বিজয়ীদের নাম আংশিকভাবে মাস্ক করা হতে পারে।",
    prizeLimitsTitle: "পুরস্কার সীমা এবং পুরস্কার কাঠামো",
    prizeLimitsIntro: "ন্যায্যতা, স্বচ্ছতা এবং দীর্ঘমেয়াদী স্থায়িত্ব নিশ্চিত করতে, Migratesafely.com নিম্নলিখিত পুরস্কার নির্দেশিকা প্রয়োগ করে:",
    maxPrize: "যেকোনো একক ড্রতে সর্বোচ্চ প্রথম পুরস্কার BDT 2,000,000 (20 লাখ) অতিক্রম করবে না।",
    variablePrizes: "ড্র সময়কালে সক্রিয় পেইড সদস্যপদ স্তরের উপর নির্ভর করে প্রদত্ত পুরস্কারের সংখ্যা (প্রথম, দ্বিতীয়, তৃতীয়, বা অতিরিক্ত সম্প্রদায় পুরস্কার) ভিন্ন হতে পারে।",
    notLottery: "পুরস্কার ড্রগুলি একটি সম্প্রদায় সুবিধা হিসাবে ডিজাইন করা হয়েছে এবং লটারি বা জুয়া পণ্য নয়।",
    funding: "সমস্ত পুরস্কার পরিচালনাগত উদ্বৃত্ত এবং সম্প্রদায়ের উদ্যোগ থেকে অর্থায়ন করা হয়, পৃথক সদস্যদের অবদান থেকে নয়।",
    announcement: "চূড়ান্ত পুরস্কার কাঠামো প্রতিটি ড্রের আগে ঘোষণা করা হয়।",
    complianceNotice: "পুরস্কার ড্র একটি সদস্য সুবিধা এবং এটি একটি জুয়া পণ্য নয়। নিবন্ধিত সদস্যদের জন্য অংশগ্রহণ বিনামূল্যে।"
  }
};

export default function WinnersPage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Head>
        <title>{t.title} | Migratesafely.com</title>
        <meta name="description" content={t.metaDescription} />
      </Head>

      <AppHeader />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          {t.title}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {t.subtitle}
        </p>

        {/* Purpose of Community Prize Draws Section - IDENTICAL TO PRIZE DRAW PAGE */}
        <section className="mb-12 scroll-mt-20">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              {t.purposeTitle}
            </h2>
            
            {/* Main Purpose - 3 bullets */}
            <div className="space-y-4 mb-8">
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  <span>{t.purposeBullet1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  <span>{t.purposeBullet2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  <span className="font-semibold">{t.purposeBullet3}</span>
                </li>
              </ul>
            </div>

            {/* Eligibility & Compliance Rules - Blue Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {t.eligibilityTitle}
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{t.eligibilityBullet1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{t.eligibilityBullet2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>{t.eligibilityBullet3}</span>
                    <ul className="mt-2 ml-6 space-y-1 text-sm">
                      <li>• {t.eligibilityBullet3a}</li>
                      <li>• {t.eligibilityBullet3b}</li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>

            {/* Payment & Verification Rules - Green Box */}
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                {t.paymentTitle}
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  </div>
                  <span className="font-semibold">{t.paymentBullet1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  </div>
                  <span className="font-semibold">{t.paymentBullet2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  </div>
                  <span>{t.paymentBullet3}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  </div>
                  <span className="font-semibold">{t.paymentBullet4}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How Winners Are Selected */}
        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            {t.howWinnersTitle}
          </h2>

          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>{t.randomPrizes}</strong> {t.randomPrizesDesc}
            </li>
            <li>
              <strong>{t.communityAwards}</strong> {t.communityAwardsDesc}
            </li>
          </ul>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {t.privacyNote}
          </p>
        </section>

        {/* Prize Limits & Award Structure */}
        <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            {t.prizeLimitsTitle}
          </h2>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t.prizeLimitsIntro}
          </p>

          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>{t.maxPrize}</li>
            <li>{t.variablePrizes}</li>
            <li>{t.notLottery}</li>
            <li>{t.funding}</li>
            <li>{t.announcement}</li>
          </ul>
        </section>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700">
          <p>{t.complianceNotice}</p>
        </div>
      </main>
    </div>
  );
}