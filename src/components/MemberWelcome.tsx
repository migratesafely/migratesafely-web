import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MemberWelcomeProps {
  firstName: string;
  memberNumber: string;
  isFirstLogin: boolean;
}

/**
 * Member Welcome Component
 * 
 * Displays personalized welcome messages:
 * - First login: One-time welcome with member number
 * - Returning visits: Subtle "Welcome back" greeting
 * 
 * PROMPT A5.6: Member Experience Polish
 */
export function MemberWelcome({ firstName, memberNumber, isFirstLogin }: MemberWelcomeProps) {
  const [showFirstLoginWelcome, setShowFirstLoginWelcome] = useState(isFirstLogin);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show first login welcome if not yet seen
    if (isFirstLogin) {
      setShowFirstLoginWelcome(true);
    }
  }, [isFirstLogin]);

  const handleDismissWelcome = async () => {
    try {
      // Mark welcome as seen in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ welcome_seen: true })
        .eq("id", user.id);

      setShowFirstLoginWelcome(false);
      setDismissed(true);
    } catch (error) {
      console.error("Error marking welcome as seen:", error);
      // Still dismiss locally even if DB update fails
      setShowFirstLoginWelcome(false);
      setDismissed(true);
    }
  };

  // First Login Welcome (One-time, prominent)
  if (showFirstLoginWelcome && !dismissed) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg">
              Welcome to your personal member portal, <strong>{firstName}</strong>.
            </p>
            <p className="text-base">
              Your membership number is <strong className="font-mono">{memberNumber}</strong>.
            </p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            This portal is your secure space to access verification tools, track activity, manage benefits, 
            and stay protected within the MigrateSafely community.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleDismissWelcome} size="lg">
            Enter My Portal
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Returning user - subtle greeting
  if (!isFirstLogin && firstName && memberNumber) {
    return (
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          Welcome back, <strong>{firstName}</strong>.{" "}
          <span className="text-muted-foreground">
            Membership Number: {memberNumber}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}