import React from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const TEXT = {
  en: {
    tagline: "Connecting people to verified migration professionals through a secure, request-based process.",
    quickLinks: "Quick Links",
    about: "About Us",
    embassy: "Embassy Directory",
    signup: "Sign Up",
    login: "Login",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    disclaimer: "Disclaimer",
    memberResources: "Member Resources",
    memberDashboard: "Member Dashboard",
    agentDashboard: "Agent Dashboard",
    requestAgent: "Request Agent Connection",
    scamReports: "Scam Reports",
    prizeDraw: "Prize Draws",
    copyright: "© 2026 MigrateSafely.com. All rights reserved.",
    note: "Not a visa agency. We connect members to verified professionals only."
  },
  bn: {
    tagline: "নিরাপদ, অনোধ-ভিত্তিক প্রক্রিয়ার মাধ্যমে যাচাইকৃত মাইগ্রেশন পেশাদার সাথে মানুষকে সংযুক্ত করা।",
    quickLinks: "দ্রুত লিঙ্ক",
    about: "আমাদের সম্পর্কে",
    embassy: "দূতাবাস ডিরেক্টরি",
    signup: "সাইন আপ",
    login: "লগইন",
    privacy: "গোপনীয়তা নীতি",
    terms: "সেবার শর্তাবলী",
    disclaimer: "দাবিত্যাগ",
    memberResources: "সদস্য সংস্থান",
    memberDashboard: "সদস্য ড্যাশবোর্ড",
    agentDashboard: "এজেন্ট ড্যাশবোর্ড",
    requestAgent: "এজেন্ট সংযোগ অনুরোধ করুন",
    scamReports: "প্রতারণা রিপোর্ট",
    prizeDraw: "পুরস্কার ড্র",
    copyright: "© ২০২৬ MigrateSafely.com। সর্বস্বত্ব সংরক্ষিত।",
    note: "ভিসা এজেন্সি নয়। আমরা শুধুমাত্র যাচাইকৃত পেশাদারদের সাথে সদস্যদের সংযুক্ত করি।"
  }
};

export function PublicFooter() {
  const { language } = useLanguage();
  const t = TEXT[language as keyof typeof TEXT] || TEXT.en;

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">MigrateSafely.com</h3>
            <p className="text-sm">
              {t.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.quickLinks}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">{t.about}</Link></li>
              <li><Link href="/signup" className="hover:text-white">{t.signup}</Link></li>
              <li><Link href="/login" className="hover:text-white">{t.login}</Link></li>
              <li><Link href="/privacy" className="hover:text-white">{t.privacy}</Link></li>
              <li><Link href="/terms" className="hover:text-white">{t.terms}</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white">{t.disclaimer}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.memberResources}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="hover:text-white">{t.memberDashboard}</Link></li>
              <li><Link href="/agents/dashboard" className="hover:text-white">{t.agentDashboard}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} MigrateSafely.com. {t.copyright}</p>
          <p className="mt-2 text-gray-500">
            {t.note}
          </p>
        </div>
      </div>
    </footer>
  );
}