"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
import { getThemeByBDTime } from "@/lib/bdTime";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    // Set default theme based on Bangladesh time if no manual preference stored
    const stored = localStorage.getItem("theme");
    if (!stored) {
      const bangladeshTheme = getThemeByBDTime();
      localStorage.setItem("theme", bangladeshTheme);
    }

    // Auto-update theme every minute to catch 6 AM/6 PM boundaries
    const checkTheme = () => {
      const stored = localStorage.getItem("theme");
      // Only auto-switch if user hasn't manually set a preference
      // Manual preferences are: "light", "dark", or "system"
      // If they match current auto-theme, we can auto-update
      const currentAutoTheme = getThemeByBDTime();
      
      // If stored theme matches the auto theme, keep updating it
      if (stored === currentAutoTheme || !stored) {
        const newTheme = getThemeByBDTime();
        if (stored !== newTheme) {
          localStorage.setItem("theme", newTheme);
          // Trigger theme change
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(newTheme);
        }
      }
    };

    const interval = setInterval(checkTheme, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme={getThemeByBDTime()}
      enableSystem={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}