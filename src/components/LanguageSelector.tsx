import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import type { Language } from "@/services/languageService";
import { languageService, type EnabledLanguage } from "@/services/languageService";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
  showLabel?: boolean;
}

export function LanguageSelector({ variant = "default", showLabel = true }: LanguageSelectorProps) {
  const { language, setLanguage, isLoading } = useLanguage();
  const [enabledLanguages, setEnabledLanguages] = useState<EnabledLanguage[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);

  useEffect(() => {
    async function loadEnabledLanguages() {
      try {
        const languages = await languageService.getEnabledLanguages();
        setEnabledLanguages(languages);
      } catch (error) {
        console.error("Error loading enabled languages:", error);
        // Fallback to English only
        setEnabledLanguages([
          { languageCode: "en", languageNameEnglish: "English", languageNameNative: "English" }
        ]);
      } finally {
        setLoadingLanguages(false);
      }
    }

    loadEnabledLanguages();
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

  if (isLoading || loadingLanguages) {
    return null;
  }

  // Find current language in enabled languages
  const currentLanguage = enabledLanguages.find(lang => lang.languageCode === language);
  const displayValue = currentLanguage?.languageNameNative || "English";

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Language:</span>
        </div>
      )}
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className={variant === "compact" ? "w-[140px]" : "w-[180px]"}>
          <SelectValue>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {enabledLanguages.map((lang) => (
            <SelectItem key={lang.languageCode} value={lang.languageCode}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{lang.languageNameNative}</span>
                {variant !== "compact" && (
                  <span className="text-xs text-muted-foreground">({lang.languageNameEnglish})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}