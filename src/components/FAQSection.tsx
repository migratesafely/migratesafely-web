import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
}

const FAQ_DATA = {
  en: [
    {
      question: "Why should I become a member?",
      answer: "The primary benefit of membership is protection from migration scams. As a member, you get:\n\n• Access to verified migration agents\n• Embassy directory and information\n• Ability to request agent verification before you commit\n• Scam reporting tools and blacklist access\n• Community support and guidance throughout your migration journey\n• Support ticket system for direct help\n\nPrize draws are included as a bonus community benefit, not the purpose of membership. Membership is about safety, verification, and protection."
    },
    {
      question: "Are prize draws a lottery or gambling product?",
      answer: "No. Membership fees are paid for protection services, verified information, and community support.\n\nPrize draws are completely optional community benefits funded from operational surplus. They are:\n• Free to enter for eligible paid members\n• Not the reason for the membership fee\n• Not a lottery or gambling product\n• Offered when operational conditions allow\n\nYou become a member for safety and protection. Prize draws are simply a bonus benefit."
    },
    {
      question: "Can I ask Migratesafely.com to verify an agent I'm speaking to?",
      answer: "Yes. If you are approached by someone claiming to be a migration agent, members can submit an agent verification request.\n\nYou can provide:\n• Agent name or business name\n• Contact details (if available)\n• Country of operation\n• Any concerns or red flags you've noticed\n\nOur team will review available information and may conduct external checks. This is a support service to help you make informed decisions, though final responsibility remains with you."
    },
    {
      question: "Who can apply for community hardship support?",
      answer: "Eligible members facing verified hardship can apply for community support awards. This includes:\n\n• Members experiencing genuine financial hardship related to migration\n• Prior scam victims who are verified members\n• Those with documented need and circumstances\n\nSelections are made based on submitted information, verification, and available community funds — not random draws. These awards are discretionary community benefits, not guaranteed entitlements."
    },
    {
      question: "What is the primary benefit of membership?",
      answer: "The primary benefit is protection — access to verified migration agents, scam reporting tools, embassy information, and community-backed support to help you migrate safely and avoid fraud."
    },
    {
      question: "What other benefits do members receive?",
      answer: "Members receive:\n• Access to verified migration agents\n• Scam reporting and blacklist access\n• Embassy directory and updates\n• Support ticket system for direct assistance\n• Agent verification request service\n• Eligibility for community prize draws (free to enter)\n• Eligibility for community support and hardship awards\n• Internal messaging and updates from Migratesafely.com\n\nAll benefits focus on protection, safety, and informed migration decisions."
    },
    {
      question: "Are prize draws guaranteed?",
      answer: "No. Prize draws are community benefits and are not guaranteed. They are funded from operational surplus and are offered when conditions allow. Membership is for protection services — prize draws are a bonus, not a promise."
    },
    {
      question: "Does agent verification guarantee the agent is safe?",
      answer: "No. Agent verification is a support service to help you make informed decisions, not a guarantee of safety. Our team reviews available information and may conduct external checks, but final decisions and responsibility remain with you as the member."
    },
    {
      question: "Is Migratesafely.com a government agency?",
      answer: "No. Migratesafely.com is an independent private platform designed to help people migrate safely through education, verification, and community support. We are not affiliated with any government."
    },
    {
      question: "Is membership free?",
      answer: "No. Membership is paid. The fee covers access to protection services, verified information, scam reporting tools, embassy directory, support systems, and agent verification services. Prize draws and support initiatives are bonus benefits included with membership — not the reason for the fee."
    },
    {
      question: "Why does MigrateSafely offer prize draws?",
      answer: "Prize draws are a member benefit designed to help members with genuine migration-related expenses. They are not gambling, betting, or public lotteries."
    },
    {
      question: "Who can participate in the prize draws?",
      answer: "Prize draws are free to enter but are only available to registered MigrateSafely members."
    },
    {
      question: "How are prizes paid to winners?",
      answer: "All prizes are paid via bank transfer only to the verified winner. No cash, vouchers, or visa services are provided as prizes."
    },
    {
      question: "What is the intended use of prize funds?",
      answer: "Prize funds are intended to assist with migration-related costs. Members are responsible for lawful and appropriate use."
    }
  ],
  bn: [
    {
      question: "আমি কেন সদস্য হব?",
      answer: "সদস্যপদের প্রধান সুবিধা হল মাইগ্রেশন প্রতারণা থেকে সুরক্ষা। একজন সদস্য হিসাবে, আপনি পাবেন:\n\n• যাচাইকৃত মাইগ্রেশন এজেন্টদের অ্যাক্সেস\n• দূতাবাস ডিরেক্টরি এবং তথ্য\n• আপনি প্রতিশ্রুতিবদ্ধ হওয়ার আগে এজেন্ট যাচাইকরণের অনোধ করার ক্ষমতা\n• প্রতারণা রিপোর্টিং সরঞ্জাম এবং ব্ল্যাকলিস্ট অ্যাক্সেস\n• আপনার মাইগ্রেশন যাত্রা জুড়ে কমিউনিটি সহায়তা এবং নির্দেশনা\n• সরাসরি সাহায্যের জন্য সাপোর্ট টিকিট সিস্টেম\n\nপুরস্কার ড্র একটি বোনাস কমিউনিটি সুবিধা হিসাবে অন্তর্ভুক্ত, সদস্যপদের উদ্দেশ্য নয়। সদস্যপদ হল নিরাপত্তা, যাচাইকরণ এবং সুরক্ষা সম্পর্কে।"
    },
    {
      question: "পুরস্কার ড্র কি লটারি বা জুয়া পণ্য?",
      answer: "না। সদস্যপদ ফি সুরক্ষা সেবা, যাচাইকৃত তথ্য এবং কমিউনিটি সহায়তার জন্য প্রদান করা হয়।\n\nপুরস্কার ড্র হল কমিউনিটি সুবিধা এবং তা নিশ্চিত নয়। এগুলি:\n• যোগ্য পেইড সদস্যদের জন্য প্রবেশ বিনামূল্যে\n• সদস্যপদ ফিটির কারণ নয়\n• লটারি বা জুয়া পণ্য নয়\n• অপারেশনাল শর্ত অনুমতি দিলে অফার করা হয়\n\nআপনি নিরাপত্তা এবং সুরক্ষার জন্য সদস্য হন। পুরস্কার ড্র কেবল একটি বোনাস সুবিধা।"
    },
    {
      question: "আমি কি Migratesafely.com-কে আমার সাথে কথা বলা একজন এজেন্ট যাচাই করতে বলতে পারি?",
      answer: "হ্যাঁ। যদি কেউ আপনার কাছে মাইগ্রেশন এজেন্ট হওয়ার দাবি করে, সদস্যরা একটি এজেন্ট যাচাইকরণ অনোধ জমা দিতে পারেন।\n\nআপনি প্রদান করতে পারেন:\n• এজেন্টের নাম বা ব্যবসার নাম\n• যোগাযোগের বিবরণ (যদি পাওয়া যায়)\n• অপারেশনের দেশ\n• আপনি লক্ষ্য করেছেন এমন কোনও উদ্বেগ বা রেড ফ্ল্যাগ\n\nআমাদের টিম উপলব্ধ তথ্য পর্যালোচনা করে এবং বাহ্যিক পরীক্ষা পরিচালনা করতে পারে। এটি একটি সহায়তা সেবা যা আপনাকে সচেতন সিদ্ধান্ত নিতে সাহায্য করে, যদিও চূড়ান্ত দায়িত্ব আপনার থাকে।"
    },
    {
      question: "কমিউনিটি কষ্ট সহায়তার জন্য কে আবেদন করতে পারে?",
      answer: "যাচাইকৃত কষ্টের সম্মুখীন যোগ্য সদস্যরা কমিউনিটি সহায়তা পুরস্কারের জন্য আবেদন করতে পারেন। এর মধ্যে রয়েছে:\n\n• মাইগ্রেশন সম্পর্কিত প্রকৃত আর্থিক কষ্টের সম্মুখীন সদস্যরা\n• পূর্ববর্তী প্রতারণার শিকার যারা যাচাইকৃত সদস্য\n• নথিভুক্ত প্রয়োজন এবং পরিস্থিতি সহ যারা\n\nনির্বাচন জমা দেওয়া তথ্য, যাচাইকরণ এবং উপলব্ধ কমিউনিটি তহবিলের উপর ভিত্তি করে করা হয় — র্যান্ডম ড্র নয়। এই পুরস্কারগুলি বিচক্ষণ কমিউনিটি সুবিধা, নিশ্চিত অধিকার নয়।"
    },
    {
      question: "সদস্যপদের প্রধান সুবিধা কী?",
      answer: "প্রধান সুবিধা হল সুরক্ষা — যাচাইকৃত মাইগ্রেশন এজেন্ট, প্রতারণা রিপোর্টিং সরঞ্জাম, দূতাবাসের তথ্য এবং কমিউনিটি-ব্যাকড সহায়তার অ্যাক্সেস যা আপনাকে নিরাপদে মাইগ্রেট করতে এবং প্রতারণা এড়াতে সহায়তা করে।"
    },
    {
      question: "সদস্যরা আর কী কী সুবিধা পান?",
      answer: "সদস্যরা পান:\n• যাচাইকৃত মাইগ্রেশন এজেন্টদের অ্যাক্সেস\n• প্রতারণা রিপোর্টিং এবং ব্ল্যাকলিস্ট অ্যাক্সেস\n• দূতাবাস ডিরেক্টরি এবং আপডেট\n• সরাসরি সহায়তার জন্য সাপোর্ট টিকিট সিস্টেম\n• এজেন্ট যাচাইকরণ অনোধ সেবা\n• কমিউনিটি পুরস্কার ড্রয়ের যোগ্যতা (প্রবেশ বিনামূল্যে)\n• কমিউনিটি সহায়তা এবং কষ্ট পুরস্কারের যোগ্যতা\n• Migratesafely.com থেকে অভ্যন্তরীণ বার্তা এবং আপডেট\n\nসমস্ত সুবিধা সুরক্ষা, নিরাপত্তা এবং সচেতন মাইগ্রেশন সিদ্ধান্তের উপর ফোকাস করে।"
    },
    {
      question: "পুরস্কার ড্র কি নিশ্চিত?",
      answer: "না। পুরস্কার ড্র হল কমিউনিটি সুবিধা এবং তা নিশ্চিত নয়। এগুলি অপারেশনাল সারপ্লাস থেকে অর্থায়ন করা হয় এবং যখন শর্ত অনুমতি দেয় তখন অফার করা হয়। সদস্যপদ সুরক্ষা সেবার জন্য — পুরস্কার ড্র একটি বোনাস, প্রতিশ্রুতি নয়।"
    },
    {
      question: "এজেন্ট যাচাইকরণ কি নিশ্চিত করে যে এজেন্ট নিরাপদ?",
      answer: "না। এজেন্ট যাচাইকরণ একটি সহায়তা সেবা যা আপনাকে সচেতন সিদ্ধান্ত নিতে সাহায্য করে, নিরাপত্তার গ্যারান্টি নয়। আমাদের টিম উপলব্ধ তথ্য পর্যালোচনা করে এবং বাহ্যিক পরীক্ষা পরিচালনা করতে পারে, কিন্তু চূড়ান্ত সিদ্ধান্ত এবং দায়িত্ব সদস্য হিসাবে আপনার থাকে।"
    },
    {
      question: "Migratesafely.com কি একটি সরকারী সংস্থা?",
      answer: "না। Migratesafely.com হল একটি স্বাধীন বেসরকারী প্ল্যাটফর্ম যা শিক্ষা, যাচাইকরণ এবং কমিউনিটি সহায়তার মাধ্যমে লোকেদের নিরাপদে মাইগ্রেট করতে সাহায্য করার জন্য ডিজাইন করা হয়েছে। আমরা কোনো সরকারের সাথে সংযুক্ত নই।"
    },
    {
      question: "সদস্যপদ কি বিনামূল্যে?",
      answer: "না। সদস্যপদ প্রদত্ত। ফি সুরক্ষা সেবা, যাচাইকৃত তথ্য, প্রতারণা রিপোর্টিং সরঞ্জাম, দূতাবাস ডিরেক্টরি, সাপোর্ট সিস্টেম এবং এজেন্ট যাচাইকরণ সেবার অ্যাক্সেস কভার করে। পুরস্কার ড্র এবং সহায়তা উদ্যোগ হল সদস্যপদের সাথে অন্তর্ভুক্ত বোনাস সুবিধা — ফিটির কারণ নয়।"
    },
    {
      question: "MigrateSafely কেন পুরস্কার ড্র অফার করে?",
      answer: "পুরস্কার ড্র হল একটি সদস্য সুবিধা যা সদস্যদের প্রকৃত মাইগ্রেশন-সম্পর্কিত খরচে সাহায্য করার জন্য ডিজাইন করা হয়েছে। এগুলি জুয়া, বাজি, বা পাবলিক লটারি নয়।"
    },
    {
      question: "পুরস্কার ড্রয়ে কে অংশগ্রহণ করতে পারে?",
      answer: "পুরস্কার ড্রয়ে প্রবেশ বিনামূল্যে কিন্তু শুধুমাত্র নিবন্ধিত MigrateSafely সদস্যদের জন্য উপলব্ধ।"
    },
    {
      question: "বিজয়ীদের পুরস্কার কীভাবে প্রদান করা হয়?",
      answer: "সমস্ত পুরস্কার শুধুমাত্র যাচাইকৃত বিজয়ীর কাছে ব্যাংক ট্রান্সফারের মাধ্যমে প্রদান করা হয়। কোনো নগদ, ভাউচার, বা ভিসা সেবা পুরস্কার হিসাবে প্রদান করা হয় না।"
    },
    {
      question: "পুরস্কার তহবিলের উদ্দিষ্ট ব্যবহার কী?",
      answer: "পুরস্কার তহবিল মাইগ্রেশন-সম্পর্কিত খরচে সহায়তা করার জন্য উদ্দিষ্ট। সদস্যরা আইনসম্মত এবং উপযুক্ত ব্যবহারের জন্য দায়ী।"
    }
  ]
};

export function FAQSection({ limit, showTitle = true, compact = false }: FAQSectionProps) {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = FAQ_DATA[language as keyof typeof FAQ_DATA] || FAQ_DATA.en;
  const displayFaqs = limit ? faqs.slice(0, limit) : faqs;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const TITLE = {
    en: "Frequently Asked Questions",
    bn: "প্রায়শই জিজ্ঞাসিত প্রশ্ন"
  };

  return (
    <section className={compact ? "py-8" : "py-12"}>
      {showTitle && (
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {TITLE[language as keyof typeof TITLE]}
            </h2>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-3">
        {displayFaqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-semibold text-gray-900 dark:text-white pr-4">
                {faq.question}
              </span>
              {openIndex === index ? (
                <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {openIndex === index && (
              <div className="px-4 pb-4 pt-0">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}