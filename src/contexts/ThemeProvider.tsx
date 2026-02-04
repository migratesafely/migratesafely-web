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
    
    // Set default theme based on Bangladesh time if no preference stored
    const stored = localStorage.getItem("theme");
    if (!stored) {
      const bangladeshTheme = getThemeByBDTime();
      localStorage.setItem("theme", bangladeshTheme);
    }
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