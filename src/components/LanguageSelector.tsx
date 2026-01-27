import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as "en" | "bn")}
        className="text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <option value="en">English</option>
        <option value="bn">বাংলা</option>
      </select>
    </div>
  );
}