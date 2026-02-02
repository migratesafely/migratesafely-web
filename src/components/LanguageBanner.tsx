import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";

export function LanguageBanner() {
  const { showBanner, dismissBanner, setLanguage } = useLanguage();

  if (!showBanner) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 relative">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pr-8">
        <div className="text-sm text-center sm:text-left">
          <p className="font-medium mb-1">
            বাংলা ভাষায় দেখতে চান? (Want to view in Bengali?)
          </p>
          <p className="opacity-90 text-xs">
            We noticed your browser language is Bengali. Would you like to switch?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage("bn")}
            className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            হ্যাঁ (Yes)
          </button>
          <button
            onClick={dismissBanner}
            className="text-white/80 hover:text-white text-sm underline decoration-white/50 hover:decoration-white transition-all whitespace-nowrap"
          >
            No, keep English
          </button>
        </div>
      </div>
      <button
        onClick={dismissBanner}
        className="absolute top-2 right-2 p-1 text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss banner"
      >
        <X size={18} />
      </button>
    </div>
  );
}