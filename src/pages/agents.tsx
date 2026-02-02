import React from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Shield, 
  CheckCircle, 
  Users, 
  FileCheck,
  Globe,
  Award,
  ArrowRight,
  AlertCircle,
  HeadphonesIcon
} from "lucide-react";
import { PublicPageTeaser } from "@/components/PublicPageTeaser";

const TRANSLATIONS = {
  en: {
    pageTitle: "Migration Agents | Migratesafely.com",
    metaDescription: "Learn about Migratesafely's verified migration agents. All agents are professionally vetted and approved to assist members with migration guidance.",
    hero: {
      title: "Migration Agents",
      subtitle: "Connect with verified professionals who can guide you through your migration journey"
    },
    whatIsAgent: {
      title: "What is a Migratesafely Agent?",
      description: "Migratesafely agents are independent, licensed migration consultants who have been verified and approved by our platform. They provide professional guidance, documentation support, and assistance throughout the migration process.",
      points: [
        "Licensed and certified migration professionals",
        "Independently reviewed and verified by Migratesafely",
        "Assist members with visa applications and documentation",
        "Provide guidance on migration processes and requirements",
        "Subject to our code of conduct and ethical standards"
      ]
    },
    howItWorks: {
      title: "How Agent Services Work",
      cards: [
        {
          icon: Users,
          title: "Member Request",
          description: "Members may request agent assistance through the Migratesafely platform for guidance with their migration needs."
        },
        {
          icon: FileCheck,
          title: "Agent Assignment",
          description: "Verified agents are matched with member requests based on expertise, location, and availability."
        },
        {
          icon: Shield,
          title: "Tracked Engagement",
          description: "All agent-member interactions are tracked for transparency, compliance, and quality assurance."
        }
      ]
    },
    pricing: {
      title: "Important Information",
      notice: "Agents do NOT charge members directly through the Migratesafely platform. Any service fees are arranged privately between agents and members, in accordance with local regulations."
    },
    whoCanApply: {
      title: "Who Can Become an Agent?",
      subtitle: "We work with qualified migration professionals who meet our standards",
      requirements: [
        {
          icon: Award,
          title: "Licensed Professionals",
          description: "Must hold valid migration agent or visa consultant license from a recognized authority"
        },
        {
          icon: FileCheck,
          title: "Proven Experience",
          description: "Minimum 2 years of active practice in migration consulting or related field"
        },
        {
          icon: Shield,
          title: "Clean Professional Record",
          description: "No history of fraud, misconduct, or regulatory violations"
        },
        {
          icon: Globe,
          title: "Ethical Practice",
          description: "Commitment to transparent, honest, and client-first approach"
        }
      ]
    },
    approval: {
      title: "Agent Approval Process",
      notice: "All agent applications are carefully reviewed and approved by Migratesafely management only.",
      points: [
        "Applications are reviewed individually by our admin team",
        "Verification includes credential checks, background screening, and compliance review",
        "Only qualified professionals who meet our standards are approved",
        "Approval is not automatic and may take 3-5 business days",
        "Approved agents receive access to the agent portal and member requests"
      ]
    },
    cta: {
      title: "Ready to Join Our Network?",
      description: "If you're a licensed migration professional committed to ethical practice, we invite you to apply.",
      button: "Apply to Become an Agent",
      disclaimer: "By applying, you acknowledge that approval is subject to verification and not guaranteed."
    }
  },
  bn: {
    pageTitle: "মাইগ্রেশন এজেন্ট | Migratesafely.com",
    metaDescription: "Migratesafely-এর যাচাইকৃত মাইগ্রেশন এজেন্ট সম্পর্কে জানুন। সকল এজেন্ট পেশাগতভাবে যাচাই করা এবং সদস্যদের মাইগ্রেশন নির্দেশনায় সহায়তা করার জন্য অনুমোদিত।",
    hero: {
      title: "মাইগ্রেশন এজেন্ট",
      subtitle: "যাচাইকৃত পেশাদারদের সাথে সংযুক্ত হন যারা আপনার মাইগ্রেশন যাত্রায় আপনাকে গাইড করতে পারেন"
    },
    whatIsAgent: {
      title: "Migratesafely এজেন্ট কি?",
      description: "Migratesafely এজেন্টরা স্বাধীন, লাইসেন্সপ্রাপ্ত মাইগ্রেশন পরামর্শদাতা যারা আমাদের প্ল্যাটফর্ম দ্বারা যাচাই এবং অনুমোদিত হয়েছেন। তারা পেশাদার নির্দেশনা, ডকুমেন্টেশন সাপোর্ট এবং মাইগ্রেশন প্রক্রিয়া জুড়ে সহায়তা প্রদান করেন।",
      points: [
        "লাইসেন্সপ্রাপ্ত এবং প্রত্যয়িত মাইগ্রেশন পেশাদার",
        "Migratesafely দ্বারা স্বাধীনভাবে পর্যালোচনা এবং যাচাই করা",
        "ভিসা আবেদন এবং ডকুমেন্টেশনে সদস্যদের সহায়তা করেন",
        "মাইগ্রেশন প্রক্রিয়া এবং প্রয়োজনীয়তা সম্পর্কে নির্দেশনা প্রদান করেন",
        "আমাদের আচরণবিধি এবং নৈতিক মানদণ্ডের অধীন"
      ]
    },
    howItWorks: {
      title: "এজেন্ট সেবা কিভাবে কাজ করে",
      cards: [
        {
          icon: Users,
          title: "সদস্য অনোধ",
          description: "সদস্যরা তাদের মাইগ্রেশন প্রয়োজনের জন্য নির্দেশনা পেতে Migratesafely প্ল্যাটফর্মের মাধ্যমে এজেন্ট সহায়তার অনোধ করতে পারেন।"
        },
        {
          icon: FileCheck,
          title: "এজেন্ট নিয়োগ",
          description: "যাচাইকৃত এজেন্টদের দক্ষতা, অবস্থান এবং প্রাপ্যতার উপর ভিত্তি করে সদস্য অনোধের সাথে মিলিত করা হয়।"
        },
        {
          icon: Shield,
          title: "ট্র্যাক করা এনগেজমেন্ট",
          description: "স্বচ্ছতা, সম্মতি এবং মান নিশ্চিতকরণের জন্য সমস্ত এজেন্ট-সদস্য ইন্টার অ্যাকশন ট্র্যাক করা হয়।"
        }
      ]
    },
    pricing: {
      title: "গুরুত্বপূর্ণ তথ্য",
      notice: "এজেন্টরা Migratesafely প্ল্যাটফর্মের মাধ্যমে সদস্যদের সরাস চার্জ করেন না। যেকোনো সেবা ফি এজেন্ট এবং সদস্যদের মধ্যে ব্যক্তিগতভাবে স্থানীয় নিয়মকানুন অনুযায়ী ব্যবস্থা করা হয়।"
    },
    whoCanApply: {
      title: "কে এজেন্ট হতে পারেন?",
      subtitle: "আমরা যোগ্য মাইগ্রেশন পেশাদারদের সাথে কাজ করি যারা আমাদের মান পূরণ করেন",
      requirements: [
        {
          icon: Award,
          title: "লাইসেন্সপ্রাপ্ত পেশাদার",
          description: "স্বীকৃত কর্তৃপক্ষ থেকে বৈধ মাইগ্রেশন এজেন্ট বা ভিসা পরামর্শদাতা লাইসেন্স থাকতে হবে"
        },
        {
          icon: FileCheck,
          title: "প্রমাণিত অভিজ্ঞতা",
          description: "মাইগ্রেশন পরামর্শ বা সম্পর্কিত ক্ষেত্রে ন্যূনতম ২ বছরের সক্রিয় অনুশীলন"
        },
        {
          icon: Shield,
          title: "পরিষ্কার পেশাদার রেকর্ড",
          description: "জালিয়াতি, অসদাচরণ বা নিয়ন্ত্রক লঙ্ঘনের কোন ইতিহাস নেই"
        },
        {
          icon: Globe,
          title: "নৈতিক অনুশীলন",
          description: "স্বচ্ছ, সৎ এবং ক্লায়েন্ট-প্রথম পদ্ধতির প্রতিশ্রুতি"
        }
      ]
    },
    approval: {
      title: "এজেন্ট অনুমোদন প্রক্রিয়া",
      notice: "সমস্ত এজেন্ট আবেদন Migratesafely ব্যবস্থাপনা দ্বারা সাবধানে পর্যালোচনা এবং অনুমোদিত হয়।",
      points: [
        "আবেদনগুলি আমাদের অ্যাডমিন টিম দ্বারা পৃথকভাবে পর্যালোচনা করা হয়",
        "যাচাইকরণে শংসাপত্র পরীক্ষা, ব্যাকগ্রাউন্ড স্ক্রিনিং এবং সম্মতি পর্যালোচনা অন্তর্ভুক্ত",
        "শুধুমাত্র যোগ্য পেশাদাররা যারা আমাদের মান পূরণ করেন তারা অনুমোদিত হন",
        "অনুমোদন স্বয়ংক্রিয় নয় এবং ৩-৫ কার্যদিবস সময় লাগতে পারে",
        "অনুমোদিত এজেন্টরা এজেন্ট পোর্টাল এবং সদস্য অনুরোধে অ্যাক্সেস পান"
      ]
    },
    cta: {
      title: "আমাদের নেটওয়ার্কে যোগদান করতে প্রস্তুত?",
      description: "আপনি যদি নৈতিক অনুশীলনে প্রতিশ্রুতিবদ্ধ একজন লাইসেন্সপ্রাপ্ত মাইগ্রেশন পেশাদার হন, তাহলে আমরা আপনাকে আবেদন করার জন্য আমন্ত্রণ জানাই।",
      button: "এজেন্ট হওয়ার জন্য আবেদন করুন",
      disclaimer: "আবেদন করার মাধ্যমে, আপনি স্বীকার করেন যে অনুমোদন যাচাইকরণের সাপেক্ষে এবং নিশ্চিত নয়।"
    }
  }
};

export default function AgentsPage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];

  return (
    <>
      <SEO
        title={t.pageTitle}
        description={t.metaDescription}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <AppHeader />

        {/* Agent Page Hero Image */}
        <section className="w-full bg-white dark:bg-gray-900 py-8">
          <div className="container mx-auto px-4">
            <img 
              src="/images/agent-page.png" 
              alt="Migration Agents - Professional Support" 
              className="w-full max-w-5xl mx-auto h-auto rounded-lg shadow-lg object-contain"
              style={{ maxHeight: "500px", objectPosition: "top center" }}
            />
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/banner-bg.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Verified Professionals</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                {t.hero.title}
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
                {t.hero.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Member-Only Teaser */}
        <div className="mb-12">
          <PublicPageTeaser showCTA={false} />
        </div>

        {/* What is a Migratesafely Agent */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  {t.whatIsAgent.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t.whatIsAgent.description}
                </p>
              </div>

              <Card className="p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
                <ul className="space-y-4">
                  {t.whatIsAgent.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300 text-lg">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.howItWorks.title}
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {t.howItWorks.cards.map((card, index) => {
                  const IconComponent = card.icon;
                  return (
                    <Card key={index} className="p-8 text-center hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        {card.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {card.description}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Notice */}
        <section className="py-12 bg-amber-50 dark:bg-amber-900/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="p-6 border-2 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t.pricing.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t.pricing.notice}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Who Can Apply */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.whoCanApply.title}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {t.whoCanApply.subtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {t.whoCanApply.requirements.map((req, index) => {
                  const IconComponent = req.icon;
                  return (
                    <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {req.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {req.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Approval Process */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  {t.approval.title}
                </h2>
                <Card className="p-6 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 justify-center">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t.approval.notice}
                    </p>
                  </div>
                </Card>
              </div>

              <Card className="p-8 bg-white/80 backdrop-blur-sm">
                <ul className="space-y-4">
                  {t.approval.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Users className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.cta.title}
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                {t.cta.description}
              </p>
              
              <Link href="/agents/apply">
                <Button 
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 h-auto"
                >
                  {t.cta.button}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <p className="text-sm text-blue-200 mt-6">
                {t.cta.disclaimer}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}