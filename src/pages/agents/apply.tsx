import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Globe, 
  Users, 
  Award,
  FileText,
  Search,
  UserCheck,
  Mail,
  ArrowRight,
  Info,
  Loader2,
  AlertCircle
} from "lucide-react";
import { authService } from "@/services/authService";
import { systemSettingsService } from "@/services/systemSettingsService";
import { supabase } from "@/integrations/supabase/client";

const TRANSLATIONS = {
  en: {
    pageTitle: "Become a Verified Agent",
    metaDescription: "Join our network of verified migration agents. Help clients navigate visa processes safely and ethically.",
    hero: {
      title: "Become a Verified Agent",
      subtitle: "Join our trusted network of licensed migration and visa consultants",
      cta: "Apply Now"
    },
    whoCanApply: {
      title: "Who Can Apply",
      subtitle: "We verify professional migration agents who meet our standards",
      requirements: [
        {
          title: "Licensed Professionals",
          description: "Must hold valid migration agent or visa consultant license from recognized authority"
        },
        {
          title: "Proven Experience",
          description: "Minimum 2 years of active practice in migration consulting"
        },
        {
          title: "Clean Record",
          description: "No history of fraud, misconduct, or regulatory violations"
        },
        {
          title: "Ethical Practice",
          description: "Commitment to transparent, honest, and client-first approach"
        }
      ]
    },
    countriesSupported: {
      title: "Countries We Support",
      subtitle: "Currently verifying agents in the following countries",
      note: "Expanding to more countries soon",
      countries: [
        {
          name: "Bangladesh",
          status: "Active",
          description: "Verifying licensed migration agents serving Bangladeshi clients"
        }
      ]
    },
    verificationProcess: {
      title: "Verification Process",
      subtitle: "Our thorough review ensures only qualified agents join our network",
      steps: [
        {
          icon: FileText,
          title: "Submit Application",
          description: "Complete the application form with your credentials and experience"
        },
        {
          icon: Search,
          title: "Document Review",
          description: "Our team verifies your license, qualifications, and professional history"
        },
        {
          icon: UserCheck,
          title: "Background Check",
          description: "We check for any complaints, violations, or red flags"
        },
        {
          icon: Mail,
          title: "Approval Decision",
          description: "Receive notification within 3-5 business days"
        }
      ],
      timeline: "Typical review time: 3-5 business days"
    },
    codeOfConduct: {
      title: "Code of Conduct",
      subtitle: "All verified agents must adhere to these principles",
      principles: [
        "Never guarantee visa or immigration outcomes",
        "Provide transparent pricing with written contracts",
        "Maintain client confidentiality at all times",
        "Stay updated on immigration laws and regulations",
        "Never request upfront payment before providing services",
        "Respond to client inquiries within 48 hours",
        "Report any conflicts of interest immediately",
        "Maintain professional liability insurance"
      ]
    },
    disclaimer: {
      title: "Important Disclaimer",
      points: [
        "Approval is not guaranteed. All applications are reviewed individually.",
        "Migrate Safely acts as an introduction platform only. We do not employ agents.",
        "Agents are independent professionals responsible for their own services.",
        "We do not guarantee client placements or income to agents.",
        "Agents must comply with all local laws and regulations.",
        "We reserve the right to suspend or remove agents who violate our standards."
      ]
    },
    benefits: {
      title: "Benefits of Joining",
      subtitle: "Why become a verified agent with Migrate Safely",
      items: [
        {
          title: "Client Trust",
          description: "Verified badge increases client confidence in your services"
        },
        {
          title: "Quality Leads",
          description: "Connect with serious clients who value professional guidance"
        },
        {
          title: "Platform Support",
          description: "Access to resources, templates, and professional community"
        },
        {
          title: "No Upfront Fees",
          description: "Free to apply and join our network"
        }
      ]
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          q: "How much does it cost to apply?",
          a: "Application and verification are completely free. There are no upfront fees or subscription charges."
        },
        {
          q: "How long does verification take?",
          a: "Most applications are reviewed within 3-5 business days. Complex cases may take longer."
        },
        {
          q: "What if my application is rejected?",
          a: "You'll receive an explanation and guidance on how to address issues before reapplying."
        },
        {
          q: "Do I need to be based in Bangladesh?",
          a: "Currently, we're focusing on agents serving Bangladeshi clients. You can be based anywhere but must be licensed to serve Bangladesh."
        },
        {
          q: "Can I serve clients from multiple countries?",
          a: "Yes, as long as you hold appropriate licenses for each jurisdiction you serve."
        },
        {
          q: "How do I receive client requests?",
          a: "Once approved, you'll access our agent dashboard where you can view and respond to client requests."
        }
      ]
    },
    cta: {
      ready: "Ready to Join?",
      description: "Start your application today and become part of our trusted network",
      button: "Apply Now",
      alreadyMember: "Already a member?",
      login: "Login here"
    }
  },
  bn: {
    pageTitle: "যাচাইকৃত এজেন্ট হন",
    metaDescription: "আমাদের যাচাইকৃত মাইগ্রেশন এজেন্টদের নেটওয়ার্কে যোগ দিন। ক্লায়েন্টদের নিরাপদ এবং নৈতিকভাবে ভিসা প্রক্রিয়ায় সাহায্য করুন।",
    hero: {
      title: "যাচাইকৃত এজেন্ট হন",
      subtitle: "লাইসেন্সপ্রাপ্ত মাইগ্রেশন এবং ভিসা পরামর্শদাতাদের আমাদের বিশ্বস্ত নেটওয়ার্কে যোগ দিন",
      cta: "এখনই আবেদন করুন"
    },
    whoCanApply: {
      title: "কে আবেদন করতে পারেন",
      subtitle: "আমরা পেশাদার মাইগ্রেশন এজেন্টদের যাচাই করি যারা আমাদের মান পূরণ করেন",
      requirements: [
        {
          title: "লাইসেন্সপ্রাপ্ত পেশাদার",
          description: "স্বীকৃত কর্তৃপক্ষ থেকে বৈধ মাইগ্রেশন এজেন্ট বা ভিসা পরামর্শদাতা লাইসেন্স থাকতে হবে"
        },
        {
          title: "প্রমাণিত অভিজ্ঞতা",
          description: "মাইগ্রেশন পরামর্শে ন্যূনতম ২ বছরের সক্রিয় অনুশীলন"
        },
        {
          title: "পরিষ্কার রেকর্ড",
          description: "জালিয়াতি, অসদাচরণ বা নিয়ন্ত্রক লঙ্ঘনের কোন ইতিহাস নেই"
        },
        {
          title: "নৈতিক অনুশীলন",
          description: "স্বচ্ছ, সৎ এবং ক্লায়েন্ট-প্রথম পদ্ধতির প্রতিশ্রুতি"
        }
      ]
    },
    countriesSupported: {
      title: "আমরা যে দেশগুলিকে সমর্থন করি",
      subtitle: "বর্তমানে নিম্নলিখিত দেশগুলিতে এজেন্ট যাচাই করছি",
      note: "শীঘ্রই আরও দেশে সম্প্রসারণ",
      countries: [
        {
          name: "বাংলাদেশ",
          status: "সক্রিয়",
          description: "বাংলাদেশী ক্লায়েন্টদের পরিবেশনকারী লাইসেন্সপ্রাপ্ত মাইগ্রেশন এজেন্ট যাচাই করছি"
        }
      ]
    },
    verificationProcess: {
      title: "যাচাইকরণ প্রক্রিয়া",
      subtitle: "আমাদের পুঙ্খানুপুন পর্যালোচনা নিশ্চিত করে যে শুধুমাত্র যোগ্য এজেন্টরা আমাদের নেটওয়ার্কে যোগদান করেন",
      steps: [
        {
          icon: FileText,
          title: "আবেদন জমা দিন",
          description: "আপনার শংসাপত্র এবং অভিজ্ঞতা সহ আবেদন ফর্মটি পূরণ করুন"
        },
        {
          icon: Search,
          title: "নথি পর্যালোচনা",
          description: "আমাদের দল আপনার লাইসেন্স, যোগ্যতা এবং পেশাদার ইতিহাস যাচাই করে"
        },
        {
          icon: UserCheck,
          title: "ব্যাকগ্রাউন্ড চেক",
          description: "আমরা কোন অভিযোগ, লঙ্ঘন বা সতর্কতা চিহ্ন পরীক্ষা করি"
        },
        {
          icon: Mail,
          title: "অনুমোদন সিদ্ধান্ত",
          description: "৩-৫ কার্যদিবসের মধ্যে বিজ্ঞপ্তি পান"
        }
      ],
      timeline: "সাধারণ পর্যালোচনা সময়: ৩-৫ কার্যদিবস"
    },
    codeOfConduct: {
      title: "আচরণবিধি",
      subtitle: "সমস্ত যাচাইকৃত এজেন্টকে এই নীতিগুলি মেনে চলতে হবে",
      principles: [
        "কখনও ভিসা বা ইমিগ্রেশন ফলাফলের গ্যারান্টি দেবেন না",
        "লিখিত চুক্তি সহ স্বচ্ছ মূল্য প্রদান করুন",
        "সর্বদা ক্লায়েন্টের গোপনীয়তা বজায় রাখুন",
        "ইমিগ্রেশন আইন এবং বিধিমালা মেনে চলতে হবে।",
        "পরিষেবা প্রদানের আগে কখনও অগ্রিম পেমেন্টের অনোধ করবেন না",
        "৪৮ ঘন্টার মধ্যে ক্লায়েন্ট অনুসন্ধানের উত্তর দিন",
        "অবিলম্বে যে কোন স্বার্থের সংঘাত রিপোর্ট করুন",
        "পেশাদার দায়বদ্ধতা বীমা বজায় রাখুন"
      ]
    },
    disclaimer: {
      title: "গুরুত্বপূর্ণ দাবিত্যাগ",
      points: [
        "অনুমোদন নিশ্চিত নয়। সমস্ত আবেদন পৃথকভাবে পর্যালোচনা করা হয়।",
        "মাইগ্রেট সেফলি শুধুমাত্র একটি পরিচয় প্ল্যাটফর্ম হিসাবে কাজ করে। আমরা এজেন্টদের নিয়োগ করি না।",
        "এজেন্টরা তাদের নিজস্ব পরিষেবার জন্য দায়ী স্বতন্ত্র পেশাদার।",
        "আমরা এজেন্টদের ক্লায়েন্ট প্লেসমেন্ট বা আয়ের গ্যারান্টি দিই না।",
        "এজেন্টদের অবশ্যই সমস্ত স্থানীয় আইন এবং বিধিমালা মেনে চলতে হবে।",
        "আমরা আমাদের মান লঙ্ঘনকারী এজেন্টদের স্থগিত বা অপসারণ করার অধিকার সংরক্ষণ করি।"
      ]
    },
    benefits: {
      title: "যোগদানের সুবিধা",
      subtitle: "মাইগ্রেট সেফলির সাথে যাচাইকৃত এজেন্ট হওয়ার কারণ",
      items: [
        {
          title: "ক্লায়েন্ট বিশ্বাস",
          description: "যাচাইকৃত ব্যাজ আপনার পরিষেবাগুলিতে ক্লায়েন্টের আত্মবিশ্বাস বাড়ায়"
        },
        {
          title: "মানসম্পন্ন লিড",
          description: "পেশাদার নির্দেশনার মূল্য দেয় এমন গুরুতর ক্লায়েন্টদের সাথে সংযোগ করুন"
        },
        {
          title: "প্ল্যাটফর্ম সমর্থন",
          description: "সংস্থান, টেমপ্লেট এবং পেশাদার সম্প্রদায়ের অ্যাক্সেস"
        },
        {
          title: "কোন অগ্রিম ফি নেই",
          description: "আমাদের নেটওয়ার্কে আবেদন এবং যোগদান বিনামূল্যে"
        }
      ]
    },
    faq: {
      title: "প্রায়শই জিজ্ঞাসিত প্রশ্ন",
      items: [
        {
          q: "আবেদন করতে কত খরচ হয়?",
          a: "আবেদন এবং যাচাইকরণ সম্পূর্ণ বিনামূল্যে। কোন অগ্রিম ফি বা সাবস্ক্রিপশন চার্জ নেই।"
        },
        {
          q: "যাচাইকরণ কত সময় নেয়?",
          a: "বেশিরভাগ আবেদন ৩-৫ কার্যদিবসের মধ্যে পর্যালোচনা করা হয়। জটিল ক্ষেত্রে আরও বেশি সময় লাগতে পারে।"
        },
        {
          q: "আমার আবেদন প্রত্যাখ্যান হলে কি হবে?",
          a: "আপনি একটি ব্যাখ্যা এবং পুনরায় আবেদন করার আগে সমস্যাগুলি সমাধান করার নির্দেশনা পাবেন।"
        },
        {
          q: "আমাকে কি বাংলাদেশে অবস্থিত হতে হবে?",
          a: "বর্তমানে, আমরা বাংলাদেশী ক্লায়েন্টদের পরিবেশনকারী এজেন্টদের উপর ফোকাস করছি। আপনি যে কোন জায়গায় থাকতে পারেন তবে বাংলাদেশ সেবা দেওয়ার জন্য লাইসেন্সপ্রাপ্ত হতে হবে।"
        },
        {
          q: "আমি কি একাধিক দেশের ক্লায়েন্টদের পরিবেশন করতে পারি?",
          a: "হ্যাঁ, যতক্ষণ আপনি যে প্রতিটি এলাকায় সেবা দেন তার জন্য উপযুক্ত লাইসেন্স রাখেন।"
        },
        {
          q: "আমি কিভাবে ক্লায়েন্ট অনুরোধ পাই?",
          a: "একবার অনুমোদিত হলে, আপনি আমাদের এজেন্ট ড্যাশবোর্ড অ্যাক্সেস করবেন যেখানে আপনি ক্লায়েন্ট অনুরোধগুলি দেখতে এবং সাড়া দিতে পারবেন।"
        }
      ]
    },
    cta: {
      ready: "যোগদান করতে প্রস্তুত?",
      description: "আজই আপনার আবেদন শুরু করুন এবং আমাদের বিশ্বস্ত নেটওয়ার্কের অংশ হন",
      button: "এখনই আবেদন করুন",
      alreadyMember: "ইতিমধ্যে সদস্য?",
      login: "এখানে লগইন করুন"
    }
  }
};

export default function BecomeAgentPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationsEnabled, setApplicationsEnabled] = useState(true);
  const [checkingApplications, setCheckingApplications] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const scrollToApplication = () => {
    router.push("/verify-agent");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    async function checkApplicationStatus() {
      try {
        const enabled = await systemSettingsService.isAgentApplicationsEnabled();
        setApplicationsEnabled(enabled);
      } catch (error) {
        console.error("Error checking agent applications status:", error);
        setApplicationsEnabled(false);
      } finally {
        setCheckingApplications(false);
      }
    }

    checkApplicationStatus();
  }, []);

  async function checkAuth() {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const profileData = await authService.getUserProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          // If already an agent/pending, redirect to dashboard/status
          if (["agent", "agent_pending", "agent_suspended"].includes(profileData.role)) {
            router.push(authService.getDashboardPath(profileData.role));
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error checking auth:", error);
      setLoading(false);
    }
  }

  return (
    <>
      <SEO
        title={t.pageTitle}
        description={t.metaDescription}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <AppHeader />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/banner-bg.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Trusted Network</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                {t.hero.title}
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
                {t.hero.subtitle}
              </p>

              <Button 
                size="lg" 
                onClick={scrollToApplication}
                className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 h-auto"
              >
                {t.hero.cta}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
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
                {t.whoCanApply.requirements.map((req, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Countries Supported */}
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.countriesSupported.title}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {t.countriesSupported.subtitle}
                </p>
              </div>

              <div className="space-y-4">
                {t.countriesSupported.countries.map((country, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Globe className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {country.name}
                            </h3>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {country.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {country.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <Info className="w-4 h-4" />
                  {t.countriesSupported.note}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Process */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.verificationProcess.title}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {t.verificationProcess.subtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {t.verificationProcess.steps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={index} className="relative">
                      <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-8">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                  <Info className="w-4 h-4" />
                  {t.verificationProcess.timeline}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.benefits.title}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {t.benefits.subtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {t.benefits.items.map((benefit, index) => (
                  <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Code of Conduct */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.codeOfConduct.title}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {t.codeOfConduct.subtitle}
                </p>
              </div>

              <Card className="p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <ul className="space-y-4">
                  {t.codeOfConduct.principles.map((principle, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{principle}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-16 md:py-24 bg-amber-50 dark:bg-amber-900/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="p-8 border-2 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-4 mb-6">
                  <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {t.disclaimer.title}
                    </h2>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {t.disclaimer.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.faq.title}
                </h2>
              </div>

              <div className="space-y-6">
                {t.faq.items.map((item, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {item.q}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.a}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Users className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.cta.ready}
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                {t.cta.description}
              </p>
              
              <Button 
                size="lg"
                onClick={scrollToApplication}
                className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 h-auto mb-6"
              >
                {t.cta.button}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <div className="text-sm text-blue-200">
                {t.cta.alreadyMember}{" "}
                <Link href="/login" className="underline hover:text-white">
                  {t.cta.login}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}