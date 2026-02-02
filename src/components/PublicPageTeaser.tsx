import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertDescription } from "@/components/ui/alert";

interface PublicPageTeaserProps {
  showCTA?: boolean;
  className?: string;
  message?: string;
  buttonText?: string;
}

/**
 * Public Page Teaser Component
 * 
 * Displays a subtle teaser about member-only features on public pages.
 * Creates curiosity without revealing internal features.
 * 
 * PROMPT A5.6: Member Experience Polish
 * LOCALISATION FIX: Now supports translation via props
 */
export function PublicPageTeaser({ 
  showCTA = false, 
  className = "",
  message = "Additional benefits, tools, and upcoming services are available inside the secure member portal.",
  buttonText = "Join Now"
}: PublicPageTeaserProps) {
  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <AlertDescription className="text-sm sm:text-base">
                <span className="font-medium">
                  {message}
                </span>
              </AlertDescription>
            </div>
          </div>
          
          {showCTA && (
            <Link href="/signup">
              <Button variant="default" size="sm" className="shrink-0">
                {buttonText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}