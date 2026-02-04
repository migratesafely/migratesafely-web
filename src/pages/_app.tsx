import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LanguageBanner } from "@/components/LanguageBanner";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <LanguageBanner />
        <Component {...pageProps} />
      </LanguageProvider>
    </ThemeProvider>
  );
}