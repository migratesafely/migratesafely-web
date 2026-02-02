import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { languageService, Language } from "@/services/languageService";
import { authService } from "@/services/authService";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  showBanner: boolean;
  dismissBanner: () => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeLanguage() {
      setMounted(true);

      try {
        // Check if user is logged in
        const user = await authService.getCurrentUser();

        if (user) {
          // Member is logged in - get language preference from database
          const dbLanguage = await languageService.getMemberLanguagePreference(user.id);
          
          if (dbLanguage && languageService.isValidLanguage(dbLanguage)) {
            setLanguageState(dbLanguage);
          } else {
            // No preference saved - detect from browser and save it
            const browserLang = languageService.getBrowserLanguage();
            setLanguageState(browserLang);
            
            // Save to database for persistence
            await languageService.updateMemberLanguagePreference(user.id, browserLang);
          }
        } else {
          // Not logged in - use localStorage for public pages
          const savedLanguage = localStorage.getItem("migratesafely_language") as Language | null;
          const bannerDismissed = localStorage.getItem("migratesafely_language_banner_dismissed");
          
          if (savedLanguage && languageService.isValidLanguage(savedLanguage)) {
            setLanguageState(savedLanguage);
          } else {
            const browserLang = languageService.getBrowserLanguage();
            
            if (browserLang === "bn" && !bannerDismissed) {
              setShowBanner(true);
            }
            
            setLanguageState(browserLang);
          }
        }
      } catch (error) {
        console.error("Error initializing language:", error);
        // Fallback to English on error
        setLanguageState("en");
      } finally {
        setIsLoading(false);
      }
    }

    initializeLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    setShowBanner(false);

    if (mounted) {
      try {
        // Check if user is logged in
        const user = await authService.getCurrentUser();

        if (user) {
          // Member is logged in - save to database
          await languageService.updateMemberLanguagePreference(user.id, lang);
        } else {
          // Not logged in - save to localStorage for public pages
          localStorage.setItem("migratesafely_language", lang);
        }
      } catch (error) {
        console.error("Error saving language preference:", error);
        // Still update UI even if save fails
      }
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("migratesafely_language_banner_dismissed", "true");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, showBanner, dismissBanner, isLoading }}>
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