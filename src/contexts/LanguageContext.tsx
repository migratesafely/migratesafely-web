import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  showBanner: boolean;
  dismissBanner: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem("migratesafely_language") as Language | null;
    const bannerDismissed = localStorage.getItem("migratesafely_language_banner_dismissed");
    
    if (savedLanguage === "en" || savedLanguage === "bn") {
      setLanguageState(savedLanguage);
    } else {
      const browserLang = navigator.language || navigator.languages?.[0];
      const isBangla = browserLang?.startsWith("bn");
      
      if (isBangla) {
        setLanguageState("bn");
        if (!bannerDismissed) {
          setShowBanner(true);
        }
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (mounted) {
      localStorage.setItem("migratesafely_language", lang);
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("migratesafely_language_banner_dismissed", "true");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, showBanner, dismissBanner }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}