import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trophy, Calendar, TrendingUp, Gift, DollarSign, AlertCircle, Wallet } from "lucide-react";
import { getPrizePoolStatus, validatePrizeDrawCreation } from "@/services/accounting/prizePoolIntegration";
import { formatBDT, formatBDTPreview, parseBDT } from "@/lib/bdtFormatter";
import { CommunityPrizeAwardPanel } from "@/components/CommunityPrizeAwardPanel";
import { getDrawAwards } from "@/services/communityPrizeAwardService";

interface Country {
  countryCode: string;
  countryName: string;
  currencyCode: string;
}

interface PrizeDraw {
  id: string;
  countryCode: string;
  drawName: string | null;
  drawDate: string;
  drawTime: string | null;
  poolType: "random" | "community" | null;
  entryCutoffTime: string | null;
  announcementStatus: string;
  estimatedPrizePoolAmount: number;
  estimatedPrizePoolCurrency: string;
  forecastMemberCount: number;
  announcedAt: string | null;
  fairnessLocked: boolean;
  leftoverAmount: number;
}

interface Prize {
  id: string;
  drawId: string;
  title: string;
  description: string | null;
  prizeType: string;
  awardType: string;
  prizeValueAmount: number;
  currencyCode: string;
  numberOfWinners: number;
  status: string;
  createdAt: string;
}

interface PrizeFormData {
  title: string;
  description: string;
  prizeType: string;
  awardType: string;
  prizeValueAmount: string;
  numberOfWinners: string;
  currencyCode: string;
}

interface Winner {
  id: string;
  winnerUserId: string;
  winnerName: string | null;
  winnerEmail: string | null;
  selectedAt: string;
  claimStatus: string;
  payoutStatus: string;
  awardType: string;
}

interface PrizeWithWinners {
  prizeId: string;
  prizeTitle: string;
  prizeType: string;
  awardType: string;
  prizeValueAmount: number;
  currencyCode: string;
  numberOfWinners: number;
  winners: Winner[];
}

export default function AdminPrizeDrawsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [draws, setDraws] = useState<PrizeDraw[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [drawName, setDrawName] = useState("");
  const [drawTime, setDrawTime] = useState("20:00"); // Default 8:00 PM
  const [poolType, setPoolType] = useState<"random" | "community">("random");
  const [creating, setCreating] = useState(false);
  const [announcing, setAnnouncing] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Prize Pool Accounting State
  const [prizePoolBalance, setPrizePoolBalance] = useState(0);
  const [prizePoolLoading, setPrizePoolLoading] = useState(false);
  const [totalPrizeValue, setTotalPrizeValue] = useState<Record<string, number>>({});

  // Prizes state
  const [drawPrizes, setDrawPrizes] = useState<Record<string, Prize[]>>({});
  const [loadingPrizes, setLoadingPrizes] = useState<Record<string, boolean>>({});
  const [creatingPrize, setCreatingPrize] = useState<Record<string, boolean>>({});
  const [showPrizeForm, setShowPrizeForm] = useState<Record<string, boolean>>({}); // Added missing state
  const [prizeFormData, setPrizeFormData] = useState<Record<string, PrizeFormData>>({});

  // Winners state
  const [drawWinners, setDrawWinners] = useState<Record<string, PrizeWithWinners[]>>({});
  const [loadingWinners, setLoadingWinners] = useState<Record<string, boolean>>({});
  const [runningWinners, setRunningWinners] = useState<Record<string, boolean>>({});
  const [showRunWinnersModal, setShowRunWinnersModal] = useState<string | null>(null);

  const [communitySupportSearch, setCommunitySupportSearch] = useState<Record<string, string>>({});
  const [assigningCommunitySupport, setAssigningCommunitySupport] = useState<Record<string, boolean>>({});

  const [expiringAndRedrawing, setExpiringAndRedrawing] = useState<Record<string, boolean>>({});
  const [expireRedrawResults, setExpireRedrawResults] = useState<Record<string, { expired: number; redrawn: number }>>({});
  
  const [communityAwards, setCommunityAwards] = useState<Record<string, any[]>>({});
  const [loadingCommunityAwards, setLoadingCommunityAwards] = useState<Record<string, boolean>>({});
  const [currentAdminId, setCurrentAdminId] = useState<string>("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Check employee role for Chairman
      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employee?.role_category !== "chairman") {
        setErrorMessage("Forbidden: Chairman access required");
        setLoading(false);
        return;
      }

      setCurrentAdminId(user.id);

      await loadCountries();
      await loadDraws();
      await loadPrizePoolBalance();
      setLoading(false);
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  }

  async function loadCountries() {
    const { data, error } = await supabase
      .from("country_settings")
      .select("country_code, country_name, currency_code")
      .order("country_name");

    if (error) {
      console.error("Error loading countries:", error);
      return;
    }

    setCountries(
      data.map((c) => ({
        countryCode: c.country_code,
        countryName: c.country_name,
        currencyCode: c.currency_code || "BDT",
      }))
    );
  }

  async function loadDraws() {
    const { data, error } = await supabase
      .from("prize_draws")
      .select("*")
      .order("draw_date", { ascending: false });

    if (error) {
      console.error("Error loading draws:", error);
      return;
    }

    const drawsData = data.map((d) => ({
      id: d.id,
      countryCode: d.country_code || "",
      drawName: d.draw_name,
      drawDate: d.draw_date,
      drawTime: d.draw_time,
      poolType: d.pool_type as "random" | "community" | null,
      entryCutoffTime: d.entry_cutoff_time,
      announcementStatus: d.announcement_status || "COMING_SOON",
      estimatedPrizePoolAmount: d.estimated_prize_pool_amount || 0,
      estimatedPrizePoolCurrency: d.estimated_prize_pool_currency || "BDT",
      forecastMemberCount: d.forecast_member_count || 0,
      announcedAt: d.announced_at || null,
      fairnessLocked: d.fairness_locked || false,
      leftoverAmount: d.leftover_amount || 0,
    }));

    setDraws(drawsData);

    drawsData.forEach((draw) => {
      loadPrizesForDraw(draw.id);
      loadWinnersForDraw(draw.id);
      loadCommunityAwardsForDraw(draw.id);
      initializePrizeForm(draw.id, draw.estimatedPrizePoolCurrency);
    });
  }

  async function loadPrizePoolBalance() {
    setPrizePoolLoading(true);
    try {
      const poolStatus = await getPrizePoolStatus();
      setPrizePoolBalance(poolStatus.available_for_prizes);
    } catch (error) {
      console.error("Error loading prize pool balance:", error);
      setPrizePoolBalance(0);
    } finally {
      setPrizePoolLoading(false);
    }
  }

  async function loadPrizesForDraw(drawId: string) {
    setLoadingPrizes((prev) => ({ ...prev, [drawId]: true }));

    try {
      const response = await fetch(`/api/admin/prize-draw/prizes/list?drawId=${drawId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDrawPrizes((prev) => ({ ...prev, [drawId]: data.prizes || [] }));
        
        // Calculate total prize value for this draw
        const prizes = data.prizes || [];
        const total = prizes.reduce((sum: number, prize: Prize) => {
          return sum + (prize.prizeValueAmount * prize.numberOfWinners);
        }, 0);
        setTotalPrizeValue((prev) => ({ ...prev, [drawId]: total }));
      } else {
        console.error("Failed to load prizes:", data.error);
      }
    } catch (error) {
      console.error("Error loading prizes:", error);
    } finally {
      setLoadingPrizes((prev) => ({ ...prev, [drawId]: false }));
    }
  }

  async function loadWinnersForDraw(drawId: string) {
    setLoadingWinners((prev) => ({ ...prev, [drawId]: true }));

    try {
      const response = await fetch(`/api/admin/prize-draw/winners?drawId=${drawId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDrawWinners((prev) => ({ ...prev, [drawId]: data.prizeWinners || [] }));
      } else {
        console.error("Failed to load winners:", data.error);
      }
    } catch (error) {
      console.error("Error loading winners:", error);
    } finally {
      setLoadingWinners((prev) => ({ ...prev, [drawId]: false }));
    }
  }

  async function loadCommunityAwardsForDraw(drawId: string) {
    setLoadingCommunityAwards((prev) => ({ ...prev, [drawId]: true }));
    
    try {
      const result = await getDrawAwards(drawId);
      if (result.success) {
        setCommunityAwards((prev) => ({ ...prev, [drawId]: result.awards }));
      }
    } catch (error) {
      console.error("Error loading community awards:", error);
    } finally {
      setLoadingCommunityAwards((prev) => ({ ...prev, [drawId]: false }));
    }
  }

  function initializePrizeForm(drawId: string, currencyCode: string) {
    setPrizeFormData((prev) => ({
      ...prev,
      [drawId]: {
        title: "",
        description: "",
        prizeType: "CASH_SUPPORT",
        awardType: "RANDOM_DRAW",
        prizeValueAmount: "",
        numberOfWinners: "1",
        currencyCode: currencyCode,
      },
    }));
  }

  async function handleCreateDraw() {
    if (!selectedCountry || !drawDate || !drawName || !drawTime) {
      setErrorMessage("Please fill in all required fields (Country, Name, Date, Time)");
      return;
    }

    setCreating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/prize-draw/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: selectedCountry,
          drawName,
          drawDateIso: drawDate,
          drawTime,
          poolType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Failed to create draw");
        setCreating(false);
        return;
      }

      setSuccessMessage("Prize draw created successfully!");
      // Reset form
      setSelectedCountry("");
      setDrawDate("");
      setDrawName("");
      setDrawTime("20:00");
      setPoolType("random");
      
      await loadDraws();
      setCreating(false);
    } catch (error) {
      console.error("Error creating draw:", error);
      setErrorMessage("Error creating draw");
      setCreating(false);
    }
  }

  async function handleAnnounceDraw(drawId: string) {
    setAnnouncing(drawId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/prize-draw/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || "Failed to announce draw");
        setAnnouncing(null);
        return;
      }

      setSuccessMessage("Prize draw announced successfully!");
      await loadDraws();
      setAnnouncing(null);
    } catch (error) {
      console.error("Error announcing draw:", error);
      setErrorMessage("Error announcing draw");
      setAnnouncing(null);
    }
  }

  async function handleCreatePrize(drawId: string) {
    const formData = prizeFormData[drawId];

    if (!formData) return;

    const { title, prizeType, awardType, prizeValueAmount, numberOfWinners } = formData;

    if (!title || !prizeType || !awardType || !prizeValueAmount || !numberOfWinners) {
      setErrorMessage("All prize fields are required");
      return;
    }

    const draw = draws.find((d) => d.id === drawId);
    if (!draw) return;

    const prizeAmount = parseFloat(prizeValueAmount);
    const winners = parseInt(numberOfWinners, 10);
    const totalNewPrizeValue = prizeAmount * winners;

    // Calculate current total for this draw
    const currentDrawTotal = totalPrizeValue[drawId] || 0;
    const newDrawTotal = currentDrawTotal + totalNewPrizeValue;

    // Validate against Prize Pool balance
    const validation = await validatePrizeDrawCreation([
      ...((drawPrizes[drawId] || []).map((p) => ({ 
        amount: p.prizeValueAmount * p.numberOfWinners, 
        name: p.title 
      }))),
      { amount: totalNewPrizeValue, name: title }
    ]);

    if (!validation.allowed) {
      setErrorMessage(
        `Insufficient Prize Pool balance. Available: ${validation.current_balance} BDT, ` +
        `Required: ${validation.required} BDT, Shortfall: ${validation.shortfall} BDT`
      );
      return;
    }

    setCreatingPrize((prev) => ({ ...prev, [drawId]: true }));
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/prize-draw/prizes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawId,
          title,
          description: formData.description || "",
          prizeType,
          awardType,
          prizeValueAmount: prizeAmount,
          currencyCode: draw.estimatedPrizePoolCurrency,
          numberOfWinners: winners,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Prize created successfully");
        await loadPrizesForDraw(drawId);
        await loadPrizePoolBalance(); // Refresh pool balance
        setShowPrizeForm((prev) => ({ ...prev, [drawId]: false }));
        initializePrizeForm(drawId, draw.estimatedPrizePoolCurrency);
      } else {
        setErrorMessage(data.error || "Failed to create prize");
      }
    } catch (error) {
      console.error("Error creating prize:", error);
      setErrorMessage("Error creating prize");
    } finally {
      setCreatingPrize((prev) => ({ ...prev, [drawId]: false }));
    }
  }

  async function handleRunWinners(drawId: string) {
    setShowRunWinnersModal(null);
    setRunningWinners((prev) => ({ ...prev, [drawId]: true }));
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/prize-draw/run-winners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drawId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Winner selection complete! ${data.winnersCreated} winners selected.`);
        await loadWinnersForDraw(drawId);
      } else {
        setErrorMessage(data.error || "Failed to run winner selection");
      }
    } catch (error) {
      console.error("Error running winners:", error);
      setErrorMessage("Error running winner selection");
    } finally {
      setRunningWinners((prev) => ({ ...prev, [drawId]: false }));
    }
  }

  function updatePrizeFormField(drawId: string, field: keyof PrizeFormData, value: string) {
    setPrizeFormData((prev) => ({
      ...prev,
      [drawId]: {
        ...prev[drawId],
        [field]: value,
      },
    }));
  }

  function setQuickDate(months: number) {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    setDrawDate(date.toISOString().split("T")[0]);
  }

  function getCountryName(countryCode: string): string {
    return countries.find((c) => c.countryCode === countryCode)?.countryName || countryCode;
  }

  function canRunWinners(draw: PrizeDraw): boolean {
    if (draw.announcementStatus !== "ANNOUNCED") return false;

    const drawDate = new Date(draw.drawDate);
    const now = new Date();

    return drawDate <= now;
  }

  async function handleAssignCommunitySupport(drawId: string, prizeId: string) {
    const searchKey = `${drawId}-${prizeId}`;
    const searchValue = communitySupportSearch[searchKey];

    if (!searchValue || searchValue.trim() === "") {
      setErrorMessage("Please enter a user ID, email, or name to search");
      return;
    }

    setAssigningCommunitySupport((prev) => ({ ...prev, [searchKey]: true }));
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // First, search for the user by email, name, or userId
      let winnerUserId: string | null = null;

      // Try as UUID first
      if (searchValue.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        winnerUserId = searchValue;
      } else {
        // Search by email or name
        const { data: profiles, error: searchError } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .or(`email.ilike.%${searchValue}%,full_name.ilike.%${searchValue}%`)
          .limit(1);

        if (searchError) {
          console.error("Error searching profiles:", searchError);
          setErrorMessage("Failed to search for user");
          setAssigningCommunitySupport((prev) => ({ ...prev, [searchKey]: false }));
          return;
        }

        if (!profiles || profiles.length === 0) {
          setErrorMessage("User not found");
          setAssigningCommunitySupport((prev) => ({ ...prev, [searchKey]: false }));
          return;
        }

        winnerUserId = profiles[0].id;
      }

      if (!winnerUserId) {
        setErrorMessage("Invalid user ID");
        setAssigningCommunitySupport((prev) => ({ ...prev, [searchKey]: false }));
        return;
      }

      // Call API to assign community support winner
      const response = await fetch("/api/admin/prize-draw/assign-community-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawId,
          prizeId,
          winnerUserId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Community support winner assigned successfully!");
        setCommunitySupportSearch((prev) => ({ ...prev, [searchKey]: "" }));
        await loadWinnersForDraw(drawId);
      } else {
        setErrorMessage(data.error || "Failed to assign community support winner");
      }
    } catch (error) {
      console.error("Error assigning community support:", error);
      setErrorMessage("Error assigning community support winner");
    } finally {
      setAssigningCommunitySupport((prev) => ({ ...prev, [searchKey]: false }));
    }
  }

  async function handleExpireAndRedraw(drawId: string) {
    setExpiringAndRedrawing((prev) => ({ ...prev, [drawId]: true }));
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/prize-draw/expire-and-redraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drawId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExpireRedrawResults((prev) => ({
          ...prev,
          [drawId]: {
            expired: data.numberExpired || 0,
            redrawn: data.numberRedrawn || 0,
          },
        }));
        setSuccessMessage(
          `Successfully expired ${data.numberExpired || 0} unclaimed prize(s) and redrawn ${data.numberRedrawn || 0} winner(s)`
        );
        await loadWinnersForDraw(drawId);
      } else {
        setErrorMessage(data.error || "Failed to expire and redraw");
      }
    } catch (error) {
      console.error("Error expiring and redrawing:", error);
      setErrorMessage("Error expiring and redrawing prizes");
    } finally {
      setExpiringAndRedrawing((prev) => ({ ...prev, [drawId]: false }));
    }
  }

  function canExpireAndRedraw(draw: PrizeDraw): boolean {
    const drawDate = new Date(draw.drawDate);
    const now = new Date();
    return drawDate <= now;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage && !draws.length) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Prize Draw Management
            </h1>
            <p className="text-muted-foreground mt-2">Create and manage prize draws for countries</p>
          </div>

          {/* Prize Pool Balance Card */}
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <Wallet className="h-5 w-5" />
                Prize Draw Pool Balance
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Available funds for prize allocation (30% of membership fees)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prizePoolLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                  <span className="text-sm text-muted-foreground">Loading balance...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-700 dark:text-green-300">
                      {prizePoolBalance.toLocaleString()}
                    </span>
                    <span className="text-xl text-green-600 dark:text-green-400">BDT</span>
                  </div>
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                      This is a <strong>RESTRICTED LIABILITY</strong> account. Funds can only be used for prize payouts 
                      and community support. Prize creation is blocked if total prize value exceeds available balance.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <AlertDescription className="text-green-900 dark:text-green-100">{successMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Prize Draw
              </CardTitle>
              <CardDescription>Schedule a new prize draw for a country</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.countryCode} value={country.countryCode}>
                          {country.countryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poolType">Prize Pool Source</Label>
                  <Select value={poolType} onValueChange={(val: "random" | "community") => setPoolType(val)}>
                    <SelectTrigger id="poolType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Random Prize Pool (70%)</SelectItem>
                      <SelectItem value="community">Community Selected Pool (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Determines which funding pool will be used for prizes
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="drawName">Draw Name</Label>
                  <Input 
                    id="drawName" 
                    placeholder="e.g. Europe Migration Support Package" 
                    value={drawName} 
                    onChange={(e) => setDrawName(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawDate">Draw Date</Label>
                  <Input id="drawDate" type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawTime">Draw Time (BD Time)</Label>
                  <Input id="drawTime" type="time" value={drawTime} onChange={(e) => setDrawTime(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    Entry cutoff will be 1 hour before this time
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickDate(3)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  +3 Months
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDate(6)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  +6 Months
                </Button>
              </div>

              <Button onClick={handleCreateDraw} disabled={creating || !selectedCountry || !drawDate || !drawName} className="w-full md:w-auto">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Prize Draw
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Prize Draws</CardTitle>
              <CardDescription>Manage scheduled and active prize draws</CardDescription>
            </CardHeader>
            <CardContent>
              {draws.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No prize draws created yet</p>
              ) : (
                <div className="space-y-6">
                  {draws.map((draw) => (
                    <Card key={draw.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">
                                {draw.drawName || getCountryName(draw.countryCode)}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  draw.announcementStatus === "ANNOUNCED"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                }`}
                              >
                                {draw.announcementStatus}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(draw.drawDate).toLocaleDateString()}
                                  {draw.drawTime ? ` at ${draw.drawTime}` : ""}
                                </span>
                              </div>
                              
                              {draw.poolType && (
                                <div className="flex items-center gap-2">
                                  <Wallet className="h-4 w-4" />
                                  <span className="capitalize">{draw.poolType} Pool</span>
                                </div>
                              )}
                              
                              {draw.entryCutoffTime && (
                                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Cutoff: {new Date(draw.entryCutoffTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {draw.announcementStatus === "COMING_SOON" && (
                            <Button onClick={() => handleAnnounceDraw(draw.id)} disabled={announcing === draw.id} size="sm">
                              {announcing === draw.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Announcing...
                                </>
                              ) : (
                                "Announce Draw"
                              )}
                            </Button>
                          )}
                        </div>

                        {draw.announcementStatus === "ANNOUNCED" && draw.poolType === "community" && (
                          <div className="border-t pt-4 mt-4">
                            <CommunityPrizeAwardPanel
                              drawId={draw.id}
                              drawName={draw.drawName || `Draw ${draw.id.slice(0, 8)}`}
                              prizes={(drawPrizes[draw.id] || [])
                                .filter(p => p.awardType === "COMMUNITY_SUPPORT")
                                .map(p => ({
                                  id: p.id,
                                  title: p.title,
                                  amount: p.prizeValueAmount,
                                  awardedCount: (communityAwards[draw.id] || []).filter((a: any) => a.prize_name === p.title).length,
                                  totalCount: p.numberOfWinners
                                }))}
                              currentAdminId={currentAdminId}
                              onAwardComplete={() => {
                                loadCommunityAwardsForDraw(draw.id);
                                loadWinnersForDraw(draw.id);
                              }}
                            />
                          </div>
                        )}

                        {draw.announcementStatus === "ANNOUNCED" && (
                            <div className="border-t pt-4 mt-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg">Winner Selection</h4>
                                <button
                                  onClick={() => setShowRunWinnersModal(draw.id)}
                                  disabled={!canRunWinners(draw) || runningWinners[draw.id]}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                  {runningWinners[draw.id] ? (
                                    <span className="flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Running...
                                    </span>
                                  ) : (
                                    "Run Random Winners"
                                  )}
                                </button>
                              </div>

                              {!canRunWinners(draw) && (
                                <Alert>
                                  <AlertDescription className="text-sm">
                                    Winner selection can only be run on or after the draw date ({new Date(draw.drawDate).toLocaleDateString()})
                                  </AlertDescription>
                                </Alert>
                              )}

                              {loadingWinners[draw.id] ? (
                                <div className="text-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                                  <p className="text-sm text-muted-foreground">Loading winners...</p>
                                </div>
                              ) : drawWinners[draw.id] && drawWinners[draw.id].length > 0 ? (
                                <div className="space-y-6">
                                  {drawWinners[draw.id].map((prizeWithWinners) => (
                                    <Card key={prizeWithWinners.prizeId}>
                                      <CardHeader className="bg-muted/50">
                                        <CardTitle className="text-base flex items-center justify-between">
                                          <span>{prizeWithWinners.prizeTitle}</span>
                                          <span className="text-sm font-normal">
                                            {prizeWithWinners.awardType === "RANDOM_DRAW" ? (
                                              <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 rounded">
                                                Random Draw
                                              </span>
                                            ) : (
                                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                                                Community Support
                                              </span>
                                            )}
                                          </span>
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="pt-4">
                                        {prizeWithWinners.awardType === "RANDOM_DRAW" ? (
                                          prizeWithWinners.winners.length > 0 ? (
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-sm">
                                                <thead>
                                                  <tr className="border-b">
                                                    <th className="text-left py-2 px-2">Winner</th>
                                                    <th className="text-left py-2 px-2">Selected Date</th>
                                                    <th className="text-left py-2 px-2">Claim Status</th>
                                                    <th className="text-left py-2 px-2">Payout Status</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {prizeWithWinners.winners.map((winner) => (
                                                    <tr key={winner.id} className="border-b">
                                                      <td className="py-2 px-2">
                                                        <div>
                                                          <p className="font-medium">{winner.winnerName || "N/A"}</p>
                                                          <p className="text-xs text-muted-foreground">{winner.winnerEmail || "N/A"}</p>
                                                        </div>
                                                      </td>
                                                      <td className="py-2 px-2">
                                                        {new Date(winner.selectedAt).toLocaleDateString()}
                                                      </td>
                                                      <td className="py-2 px-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                          winner.claimStatus === "PENDING"
                                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                                            : winner.claimStatus === "CLAIMED"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                                        }`}>
                                                          {winner.claimStatus}
                                                        </span>
                                                      </td>
                                                      <td className="py-2 px-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                          winner.payoutStatus === "PENDING"
                                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                                            : winner.payoutStatus === "PAID"
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                                        }`}>
                                                          {winner.payoutStatus}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                              No winners selected yet for this prize.
                                            </p>
                                          )
                                        ) : (
                                          <div className="space-y-3">
                                            <p className="text-sm text-muted-foreground italic text-center py-2">
                                              Community support winners are selected manually by admins.
                                            </p>
                                            <div className="flex gap-2">
                                              <input
                                                type="text"
                                                placeholder="Search by email, name, or user ID..."
                                                value={communitySupportSearch[`${draw.id}-${prizeWithWinners.prizeId}`] || ""}
                                                onChange={(e) =>
                                                  setCommunitySupportSearch((prev) => ({
                                                    ...prev,
                                                    [`${draw.id}-${prizeWithWinners.prizeId}`]: e.target.value,
                                                  }))
                                                }
                                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                              />
                                              <button
                                                onClick={() =>
                                                  handleAssignCommunitySupport(draw.id, prizeWithWinners.prizeId)
                                                }
                                                disabled={
                                                  assigningCommunitySupport[
                                                    `${draw.id}-${prizeWithWinners.prizeId}`
                                                  ]
                                                }
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                              >
                                                {assigningCommunitySupport[
                                                  `${draw.id}-${prizeWithWinners.prizeId}`
                                                ] ? (
                                                  <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Assigning...
                                                  </span>
                                                ) : (
                                                  "Assign Winner"
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No winners selected yet. Click "Run Random Winners" to select winners for RANDOM_DRAW prizes.
                                </p>
                              )}
                            </div>
                          )}

                        <div className="border-t pt-4 space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Gift className="h-4 w-4 text-purple-500" />
                              Prizes for this Draw
                            </div>

                            {/* Draw Prize Total Summary */}
                            {(totalPrizeValue[draw.id] || 0) > 0 && (
                              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-purple-900 dark:text-purple-100">
                                    Total Prize Value (This Draw):
                                  </span>
                                  <span className="font-mono font-bold text-lg text-purple-700 dark:text-purple-300">
                                    {(totalPrizeValue[draw.id] || 0).toLocaleString()} BDT
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs mt-1 text-purple-700 dark:text-purple-300">
                                  <span>Remaining Pool Balance:</span>
                                  <span className={`font-mono font-semibold ${
                                    (prizePoolBalance - (totalPrizeValue[draw.id] || 0)) >= 0
                                      ? "text-green-700 dark:text-green-300"
                                      : "text-red-700 dark:text-red-300"
                                  }`}>
                                    {(prizePoolBalance - (totalPrizeValue[draw.id] || 0)).toLocaleString()} BDT
                                  </span>
                                </div>
                              </div>
                            )}

                            {loadingPrizes[draw.id] ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading prizes...
                              </div>
                            ) : drawPrizes[draw.id]?.length > 0 ? (
                              <div className="space-y-2">
                                {drawPrizes[draw.id].map((prize) => (
                                  <div
                                    key={prize.id}
                                    className="bg-muted/50 rounded-lg p-3 text-sm space-y-1"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="font-semibold">{prize.title}</div>
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded ${
                                          prize.status === "active"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                                        }`}
                                      >
                                        {prize.status}
                                      </span>
                                    </div>
                                    {prize.description && (
                                      <div className="text-muted-foreground text-xs">{prize.description}</div>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                      <span>Type: {prize.prizeType}</span>
                                      <span>Award: {prize.awardType}</span>
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        {prize.prizeValueAmount.toLocaleString()} {prize.currencyCode}
                                      </span>
                                      <span>Winners: {prize.numberOfWinners}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No prizes created yet</p>
                            )}

                            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                              <CardHeader>
                                <CardTitle className="text-base">Create Prize</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor={`title-${draw.id}`}>Title *</Label>
                                    <Input
                                      id={`title-${draw.id}`}
                                      placeholder="Grand Prize"
                                      value={prizeFormData[draw.id]?.title || ""}
                                      onChange={(e) => updatePrizeFormField(draw.id, "title", e.target.value)}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`prizeType-${draw.id}`}>Prize Type *</Label>
                                    <Select
                                      value={prizeFormData[draw.id]?.prizeType || "CASH_SUPPORT"}
                                      onValueChange={(val) => updatePrizeFormField(draw.id, "prizeType", val)}
                                    >
                                      <SelectTrigger id={`prizeType-${draw.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="EUROPE_PACKAGE">EuropePackage</SelectItem>
                                        <SelectItem value="MIDDLE_EAST_PACKAGE">Middle East Package</SelectItem>
                                        <SelectItem value="CASH_SUPPORT">Cash Support</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`awardType-${draw.id}`}>Award Type *</Label>
                                    <Select
                                      value={prizeFormData[draw.id]?.awardType || "RANDOM_DRAW"}
                                      onValueChange={(val) => updatePrizeFormField(draw.id, "awardType", val)}
                                    >
                                      <SelectTrigger id={`awardType-${draw.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="RANDOM_DRAW">Random Draw</SelectItem>
                                        <SelectItem value="COMMUNITY_SUPPORT">Community Support</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`prizeValue-${draw.id}`}>Prize Value *</Label>
                                    <Input
                                      id={`prizeValue-${draw.id}`}
                                      type="number"
                                      placeholder="50000"
                                      value={prizeFormData[draw.id]?.prizeValueAmount || ""}
                                      onChange={(e) => updatePrizeFormField(draw.id, "prizeValueAmount", e.target.value)}
                                    />
                                    {prizeFormData[draw.id]?.prizeValueAmount && (
                                      <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                        {formatBDTPreview(prizeFormData[draw.id].prizeValueAmount)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`currency-${draw.id}`}>Currency</Label>
                                    <Input
                                      id={`currency-${draw.id}`}
                                      value={prizeFormData[draw.id]?.currencyCode || "BDT"}
                                      onChange={(e) => updatePrizeFormField(draw.id, "currencyCode", e.target.value)}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`winners-${draw.id}`}>Number of Winners</Label>
                                    <Input
                                      id={`winners-${draw.id}`}
                                      type="number"
                                      min="1"
                                      value={prizeFormData[draw.id]?.numberOfWinners || "1"}
                                      onChange={(e) => updatePrizeFormField(draw.id, "numberOfWinners", e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`description-${draw.id}`}>Description</Label>
                                  <Textarea
                                    id={`description-${draw.id}`}
                                    placeholder="Optional prize description..."
                                    value={prizeFormData[draw.id]?.description || ""}
                                    onChange={(e) => updatePrizeFormField(draw.id, "description", e.target.value)}
                                    rows={2}
                                  />
                                </div>

                                {/* Prize Pool Impact Display */}
                                {prizeFormData[draw.id]?.prizeValueAmount && prizeFormData[draw.id]?.numberOfWinners && (
                                  <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                                    <TrendingUp className="h-4 w-4 text-purple-600" />
                                    <AlertDescription>
                                      <div className="space-y-2 text-sm">
                                        <div className="font-semibold text-purple-900 dark:text-purple-100">
                                          Prize Pool Impact Analysis
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-purple-800 dark:text-purple-200">
                                          <div>Current Draw Total:</div>
                                          <div className="font-mono font-semibold text-right">
                                            {(totalPrizeValue[draw.id] || 0).toLocaleString()} BDT
                                          </div>
                                          <div>This Prize Cost:</div>
                                          <div className="font-mono font-semibold text-right">
                                            {(parseFloat(prizeFormData[draw.id].prizeValueAmount) * 
                                              parseInt(prizeFormData[draw.id].numberOfWinners)).toLocaleString()} BDT
                                          </div>
                                          <div className="border-t border-purple-300 dark:border-purple-700 pt-1 font-semibold">
                                            New Draw Total:
                                          </div>
                                          <div className="border-t border-purple-300 dark:border-purple-700 pt-1 font-mono font-bold text-right">
                                            {((totalPrizeValue[draw.id] || 0) + 
                                              (parseFloat(prizeFormData[draw.id].prizeValueAmount) * 
                                               parseInt(prizeFormData[draw.id].numberOfWinners))).toLocaleString()} BDT
                                          </div>
                                          <div className="border-t border-purple-300 dark:border-purple-700 pt-1">
                                            Available Pool:
                                          </div>
                                          <div className="border-t border-purple-300 dark:border-purple-700 pt-1 font-mono font-semibold text-right">
                                            {prizePoolBalance.toLocaleString()} BDT
                                          </div>
                                          <div className={`border-t border-purple-300 dark:border-purple-700 pt-1 font-bold ${
                                            (prizePoolBalance - (totalPrizeValue[draw.id] || 0) - 
                                              (parseFloat(prizeFormData[draw.id].prizeValueAmount) * 
                                               parseInt(prizeFormData[draw.id].numberOfWinners))) >= 0
                                              ? "text-green-700 dark:text-green-300"
                                              : "text-red-700 dark:text-red-300"
                                          }`}>
                                            Remaining After:
                                          </div>
                                          <div className={`border-t border-purple-300 dark:border-purple-700 pt-1 font-mono font-bold text-right ${
                                            (prizePoolBalance - (totalPrizeValue[draw.id] || 0) - 
                                              (parseFloat(prizeFormData[draw.id].prizeValueAmount) * 
                                               parseInt(prizeFormData[draw.id].numberOfWinners))) >= 0
                                              ? "text-green-700 dark:text-green-300"
                                              : "text-red-700 dark:text-red-300"
                                          }`}>
                                            {(prizePoolBalance - (totalPrizeValue[draw.id] || 0) - 
                                              (parseFloat(prizeFormData[draw.id].prizeValueAmount) * 
                                               parseInt(prizeFormData[draw.id].numberOfWinners))).toLocaleString()} BDT
                                          </div>
                                        </div>
                                        {(prizePoolBalance - (totalPrizeValue[draw.id] || 0) - 
                                          (parseFloat(prizeFormData[draw.id].prizeValueAmount) * 
                                           parseInt(prizeFormData[draw.id].numberOfWinners))) < 0 && (
                                          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-red-900 dark:text-red-100 text-xs font-semibold">
                                            ⚠️ INSUFFICIENT BALANCE - Prize creation will be blocked
                                          </div>
                                        )}
                                      </div>
                                    </AlertDescription>
                                  </Alert>
                                )}

                                <Button
                                  onClick={() => handleCreatePrize(draw.id)}
                                  disabled={creatingPrize[draw.id] || !prizeFormData[draw.id]?.title || !prizeFormData[draw.id]?.prizeValueAmount}
                                  className="w-full"
                                >
                                  {creatingPrize[draw.id] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Creating Prize...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create Prize
                                    </>
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="flex gap-2 mt-4">
                {/* Run Winners Button */}
                <button
                  onClick={() => handleRunWinners(draw.id)}
                  disabled={runningWinners[draw.id]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {runningWinners[draw.id] ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running...
                    </span>
                  ) : (
                    "Run Winners"
                  )}
                </button>

                {/* Expire & Redraw Button */}
                {canExpireAndRedraw(draw) && (
                  <button
                    onClick={() => handleExpireAndRedraw(draw.id)}
                    disabled={expiringAndRedrawing[draw.id]}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {expiringAndRedrawing[draw.id] ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Expiring & Redrawing...
                      </span>
                    ) : (
                      "Expire Unclaimed & Redraw"
                    )}
                  </button>
                )}

                {/* Show Expire/Redraw Results */}
                {expireRedrawResults[draw.id] && (
                  <div className="text-sm bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="font-semibold text-orange-900 dark:text-orange-100">
                      Last Expire & Redraw Results:
                    </p>
                    <p className="text-orange-800 dark:text-orange-200 mt-1">
                      Expired: {expireRedrawResults[draw.id].expired} | Redrawn: {expireRedrawResults[draw.id].redrawn}
                    </p>
                  </div>
                )}
              </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {showRunWinnersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Run Winner Selection?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will randomly select winners for all RANDOM_DRAW prizes in this draw. 
                Community Support prizes will not be affected.
              </p>
              <Alert>
                <AlertDescription className="text-xs">
                  This action cannot be undone. Winners will be notified and can claim their prizes.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRunWinnersModal(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRunWinners(showRunWinnersModal)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Run Winners Now
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}