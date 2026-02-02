import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle, TrendingUp } from "lucide-react";

interface TierBenefitsDisplayProps {
  tierName: string;
  bonusPercentage: number;
  isActive: boolean;
  achievementBonusAmount?: number;
  language?: "en" | "bn" | "es" | "fr";
}

const TEXT = {
  en: {
    title: "Your Tier Benefits",
    description: "Exclusive benefits for your loyalty tier",
    tierLevel: "Tier Level",
    bonusBoost: "Bonus Boost",
    achievementBonus: "Achievement Bonus",
    oneTimeReward: "One-time reward for reaching this tier",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    bonusDescription: "Additional bonus percentage on referral rewards",
    note: "Your tier bonus is calculated based on your referral activity and applied after admin approval.",
  },
  bn: {
    title: "আপনার টায়ার সুবিধা",
    description: "আপনার লোয়া টায়ারের জন্য এক্সক্লুসিভ সুবিধা",
    tierLevel: "টায়ার লেভেল",
    bonusBoost: "বোনাস বুস্ট",
    achievementBonus: "অর্জন বোনাস",
    oneTimeReward: "এই টায়ারে পৌঁছানোর জন্য এককালীন পুরস্কার",
    status: "স্ট্যাটাস",
    active: "সক্রিয়",
    inactive: "নিষ্ক্রিয়",
    bonusDescription: "রেফারেল রিওয়ার্ডের উপর অতিরিক্ত বোনাস শতাংশ",
    note: "আপনার টায়ার বোনাস আপনার রেফারেল কার্যকলাপের ভিত্তিতে গণনা করা হয় এবং অ্যাডমিন অনুমোদনের পরে প্রয়োগ করা হয়।",
  },
  es: {
    title: "Tus Beneficios de Nivel",
    description: "Beneficios exclusivos para tu nivel de lealtad",
    tierLevel: "Nivel de Tier",
    bonusBoost: "Impulso de Bonificación",
    achievementBonus: "Bonificación de Logro",
    oneTimeReward: "Recompensa única por alcanzar este nivel",
    status: "Estado",
    active: "Activo",
    inactive: "Inactivo",
    bonusDescription: "Porcentaje de bonificación adicional en recompensas por referencias",
    note: "Tu bonificación de nivel se calcula según tu actividad de referencia y se aplica después de la aprobación del administrador.",
  },
  fr: {
    title: "Vos Avantages de Niveau",
    description: "Avantages exclusifs pour votre niveau de fidélité",
    tierLevel: "Niveau de Tier",
    bonusBoost: "Boost de Bonus",
    achievementBonus: "Bonus de Réalisation",
    oneTimeReward: "Récompense unique pour avoir atteint ce niveau",
    status: "Statut",
    active: "Actif",
    inactive: "Inactif",
    bonusDescription: "Pourcentage de bonus supplémentaire sur les récompenses de parrainage",
    note: "Votre bonus de niveau est calculé en fonction de votre activité de parrainage et appliqué après approbation de l'administrateur.",
  },
};

const TIER_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Blue: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300", icon: "text-blue-600 dark:text-blue-400" },
  Bronze: { bg: "bg-orange-50 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", icon: "text-orange-600 dark:text-orange-400" },
  Silver: { bg: "bg-gray-50 dark:bg-gray-900", text: "text-gray-700 dark:text-gray-300", icon: "text-gray-600 dark:text-gray-400" },
  Gold: { bg: "bg-yellow-50 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300", icon: "text-yellow-600 dark:text-yellow-400" },
  Platinum: { bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-300", icon: "text-purple-600 dark:text-purple-400" },
};

export function TierBenefitsDisplay({
  tierName,
  bonusPercentage,
  isActive,
  achievementBonusAmount,
  language = "en",
}: TierBenefitsDisplayProps) {
  const t = TEXT[language];
  const colors = TIER_COLORS[tierName] || TIER_COLORS.Blue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier Level */}
        <div className={`p-4 rounded-lg ${colors.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className={`h-5 w-5 ${colors.icon}`} />
              <span className={`font-semibold ${colors.text}`}>{t.tierLevel}</span>
            </div>
            <Badge className={`${colors.bg} ${colors.text} border-0`}>
              {tierName}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.bonusBoost}</span>
              <span className={`text-lg font-bold ${colors.text}`}>+{bonusPercentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.bonusDescription}</p>
          </div>

          {/* Achievement Bonus Section */}
          {achievementBonusAmount && achievementBonusAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{t.achievementBonus}</span>
                <span className={`text-xl font-bold ${colors.text}`}>৳{achievementBonusAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.oneTimeReward}</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{t.status}</span>
          <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {isActive ? t.active : t.inactive}
          </Badge>
        </div>

        {/* Note */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-200">{t.note}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}