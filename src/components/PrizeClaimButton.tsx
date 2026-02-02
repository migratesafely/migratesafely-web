import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle, XCircle, AlertCircle, Clock, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/bdtFormatter";
import {
  getMemberClaimablePrizes,
  validatePrizeClaimEligibility,
  processPrizeClaim,
  checkMemberVerificationStatus,
  formatClaimDeadline,
  type ClaimablePrize
} from "@/services/prizeClaimService";

export function PrizeClaimButton() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<ClaimablePrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndPrizes();
  }, []);

  async function loadUserAndPrizes() {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to view your prizes");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Load claimable prizes
      const result = await getMemberClaimablePrizes(user.id);
      if (!result.success) {
        setError(result.error || "Failed to load prizes");
        setLoading(false);
        return;
      }

      setPrizes(result.prizes);

      // Load verification status if there are prizes
      if (result.prizes.length > 0) {
        const status = await checkMemberVerificationStatus(user.id);
        setVerificationStatus(status);
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error loading prizes:", err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleClaimPrize(winnerId: string, prizeAmount: number) {
    if (!userId) return;

    try {
      setClaiming(winnerId);
      setError(null);
      setSuccess(null);

      // Validate eligibility first
      const validation = await validatePrizeClaimEligibility(winnerId, userId);
      
      if (!validation.eligible) {
        setError(validation.reason || "You are not eligible to claim this prize");
        setClaiming(null);
        return;
      }

      // Process claim
      const result = await processPrizeClaim(winnerId, userId, "wallet_credit");
      
      if (!result.success) {
        setError(result.error || "Failed to claim prize");
        setClaiming(null);
        return;
      }

      // Success!
      setSuccess(`Prize claimed successfully! ${formatBDT(prizeAmount)} has been credited to your wallet.`);
      setClaiming(null);

      // Reload prizes
      await loadUserAndPrizes();

    } catch (err: any) {
      console.error("Error claiming prize:", err);
      setError(err.message);
      setClaiming(null);
    }
  }

  function canClaimPrize(prize: ClaimablePrize): { canClaim: boolean; reason?: string } {
    // Check verification status
    if (!verificationStatus?.ready_to_claim) {
      return {
        canClaim: false,
        reason: verificationStatus?.missing_requirements?.join(", ") || "Verification requirements not met"
      };
    }

    // Check deadline
    const deadline = new Date(prize.claim_deadline);
    const now = new Date();
    if (now > deadline) {
      return { canClaim: false, reason: "Claim period expired" };
    }

    // Check blocked reason
    if (prize.blocked_reason) {
      return { canClaim: false, reason: prize.blocked_reason };
    }

    return { canClaim: true };
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            My Prizes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading your prizes...</p>
        </CardContent>
      </Card>
    );
  }

  if (prizes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            My Prizes
          </CardTitle>
          <CardDescription>
            You have not won any prizes yet. Keep participating in draws!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!verificationStatus?.ready_to_claim && verificationStatus?.missing_requirements && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Prize claim requirements not met:</strong>
            <ul className="mt-2 list-disc list-inside">
              {verificationStatus.missing_requirements.map((req: string, idx: number) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            My Prizes ({prizes.length})
          </CardTitle>
          <CardDescription>
            Claim your prizes before the deadline expires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prizes.map((prize) => {
            const claimStatus = canClaimPrize(prize);
            const deadlineInfo = formatClaimDeadline(prize.claim_deadline);

            return (
              <Card key={prize.winner_id} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <h3 className="font-semibold">{prize.prize_title}</h3>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Draw: {prize.draw_name}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {formatBDT(prize.prize_amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Claim by: {deadlineInfo.formatted}
                        </span>
                        {deadlineInfo.isExpiringSoon && (
                          <Badge variant="destructive" className="text-xs">
                            {deadlineInfo.daysRemaining} days left!
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {claimStatus.canClaim ? (
                        <Button
                          onClick={() => handleClaimPrize(prize.winner_id, prize.prize_amount)}
                          disabled={claiming === prize.winner_id}
                          className="w-full"
                        >
                          {claiming === prize.winner_id ? (
                            "Processing..."
                          ) : (
                            <>
                              <Wallet className="h-4 w-4 mr-2" />
                              Claim Prize
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Button disabled className="w-full">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cannot Claim
                          </Button>
                          {claimStatus.reason && (
                            <p className="text-xs text-muted-foreground text-right">
                              {claimStatus.reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}