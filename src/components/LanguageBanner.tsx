import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LanguageBanner() {
  const { showBanner, dismissBanner } = useLanguage();

  if (!showBanner) return null;

  return (
    <Alert className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
      <AlertDescription className="flex items-center justify-between">
        <span className="text-blue-900 dark:text-blue-100">
          এই সাইটটি বাংলায় দেখা যাচ্ছে — আপনি যেকোনো সময় ইংরেজিতে পরিবর্তন করতে পারেন
        </span>
        <button
          onClick={dismissBanner}
          className="ml-4 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4 text-blue-900 dark:text-blue-100" />
        </button>
      </AlertDescription>
    </Alert>
  );
}