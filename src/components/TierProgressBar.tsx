import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award } from "lucide-react";

interface TierProgressBarProps {
  currentTierName: string;
  nextTierName?: string;
  totalReferrals: number;
  nextTierRequiredReferrals?: number;
  referralsUntilNextTier?: number;
  progressPercentage: number;
  language?: "en" | "bn" | "es" | "fr";
}

const TEXT = {
  en: {
    title: "Your Tier Progress",
    description: "Track your journey to the next tier",
    currentTier: "Current Tier",
    nextTier: "Next Tier",
    totalReferrals: "Total Referrals",
    moreNeeded: "more needed",
    progress: "Progress",
    maxTier: "Maximum Tier Achieved!",
    congratulations: "Congratulations! You've reached the highest tier.",
  },
  bn: {
    title: "আপনার টায়ার অগ্রগতি",
    description: "পরবর্তী টায়ারে আপনার যাত্রা ট্র্যাক করুন",
    currentTier: "বর্তমান টায়ার",
    nextTier: "পরবর্তী টায়ার",
    totalReferrals: "মোট রেফারেল",
    moreNeeded: "আরো প্রয়োজন",
    progress: "অগ্রগতি",
    maxTier: "সর্বোচ্চ টায়ার অর্জন করেছেন!",
    congratulations: "অভিনন্দন! আপনি সর্বোচ্চ টায়ারে পৌঁছেছেন।",
  },
  es: {
    title: "Tu Progreso de Nivel",
    description: "Sigue tu camino hacia el próximo nivel",
    currentTier: "Nivel Actual",
    nextTier: "Próximo Nivel",
    totalReferrals: "Referencias Totales",
    moreNeeded: "más necesarias",
    progress: "Progreso",
    maxTier: "¡Nivel Máximo Alcanzado!",
    congratulations: "¡Felicitaciones! Has alcanzado el nivel más alto.",
  },
  fr: {
    title: "Votre Progression de Niveau",
    description: "Suivez votre parcours vers le prochain niveau",
    currentTier: "Niveau Actuel",
    nextTier: "Prochain Niveau",
    totalReferrals: "Parrainages Totaux",
    moreNeeded: "de plus nécessaires",
    progress: "Progression",
    maxTier: "Niveau Maximum Atteint!",
    congratulations: "Félicitations! Vous avez atteint le niveau le plus élevé.",
  },
};

const TIER_COLORS: Record<string, string> = {
  Blue: "bg-blue-500",
  Bronze: "bg-orange-600",
  Silver: "bg-gray-400",
  Gold: "bg-yellow-500",
  Platinum: "bg-purple-600",
};

export function TierProgressBar({
  currentTierName,
  nextTierName,
  totalReferrals,
  nextTierRequiredReferrals,
  referralsUntilNextTier,
  progressPercentage,
  language = "en",
}: TierProgressBarProps) {
  const t = TEXT[language];
  const isMaxTier = !nextTierName || progressPercentage >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current and Next Tier */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t.currentTier}</p>
            <Badge variant="outline" className="font-semibold">
              <Award className="h-3 w-3 mr-1" />
              {currentTierName}
            </Badge>
          </div>

          {!isMaxTier && (
            <>
              <div className="flex-1 mx-4">
                <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-700" />
              </div>

              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">{t.nextTier}</p>
                <Badge variant="secondary" className="font-semibold">
                  <Target className="h-3 w-3 mr-1" />
                  {nextTierName}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isMaxTier ? (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg text-center">
            <Award className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="font-semibold text-purple-900 dark:text-purple-100">{t.maxTier}</p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">{t.congratulations}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-3" />

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold text-foreground">{totalReferrals}</span>
                <span className="text-muted-foreground"> {t.totalReferrals}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-primary">{referralsUntilNextTier}</span>
                <span className="text-muted-foreground"> {t.moreNeeded}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t.progress}: {progressPercentage}%
              </span>
              {nextTierRequiredReferrals && (
                <span>
                  {t.nextTier}: {nextTierRequiredReferrals}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}