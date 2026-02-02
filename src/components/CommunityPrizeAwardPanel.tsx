import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { awardCommunityPrize } from "@/services/communityPrizeAwardService";
import { Award, Loader2, UserCheck } from "lucide-react";
import { formatBDT } from "@/lib/bdtFormatter";

interface CommunityPrizeAwardPanelProps {
  drawId: string;
  drawName: string;
  prizes: {
    id: string;
    title: string;
    amount: number;
    awardedCount: number;
    totalCount: number;
  }[];
  currentAdminId: string;
  onAwardComplete: () => void;
}

export function CommunityPrizeAwardPanel({ 
  drawId, 
  drawName, 
  prizes, 
  currentAdminId,
  onAwardComplete 
}: CommunityPrizeAwardPanelProps) {
  const { toast } = useToast();
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [memberNumber, setMemberNumber] = useState("");
  const [awarding, setAwarding] = useState(false);

  const selectedPrize = prizes.find(p => p.id === selectedPrizeId);

  async function handleAward() {
    if (!selectedPrizeId || !memberNumber) return;
    
    setAwarding(true);
    try {
      if (!selectedPrize) throw new Error("Prize not found");

      const result = await awardCommunityPrize(
        drawId,
        selectedPrize.title,
        selectedPrize.amount,
        memberNumber,
        currentAdminId
      );

      if (result.success) {
        toast({
          title: "Prize Awarded Successfully",
          description: `Member #${memberNumber} has been awarded the ${selectedPrize.title}.`,
          variant: "default",
        });
        setMemberNumber("");
        onAwardComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Award Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAwarding(false);
    }
  }

  const availablePrizes = prizes.filter(p => p.awardedCount < p.totalCount);

  if (availablePrizes.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center gap-2">
            <Award className="h-5 w-5" />
            Community Awards
          </CardTitle>
          <CardDescription>
            All community prizes for this draw have been awarded.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/10">
      <CardHeader>
        <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Award Community Prize
        </CardTitle>
        <CardDescription>
          Manually select a deserving member for the "{drawName}" community pool.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Prize to Award</Label>
          <div className="grid gap-2">
            {availablePrizes.map((prize) => (
              <div 
                key={prize.id}
                onClick={() => setSelectedPrizeId(prize.id)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center
                  ${selectedPrizeId === prize.id 
                    ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30 ring-1 ring-purple-500" 
                    : "border-border hover:border-purple-300 hover:bg-muted/50"}
                `}
              >
                <div>
                  <div className="font-medium">{prize.title}</div>
                  <div className="text-sm text-muted-foreground">{formatBDT(prize.amount)}</div>
                </div>
                <div className="text-xs bg-background px-2 py-1 rounded border">
                  {prize.awardedCount} / {prize.totalCount} awarded
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPrizeId && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="memberNumber">Member Number</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <UserCheck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="memberNumber"
                  placeholder="e.g. 100045"
                  className="pl-9"
                  value={memberNumber}
                  onChange={(e) => setMemberNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the exact membership number. The system will verify eligibility before awarding.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t bg-muted/20 p-4">
        <Button 
          onClick={handleAward} 
          disabled={!selectedPrizeId || !memberNumber || awarding}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {awarding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying & Awarding...
            </>
          ) : (
            <>
              <Award className="mr-2 h-4 w-4" />
              Confirm Award
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}