import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, CreditCard } from "lucide-react";

interface VirtualMembershipCardProps {
  memberName: string;
  memberNumber: number;
  tierName: string;
  tierColor: string;
  membershipStartDate: string;
  membershipExpiryDate: string;
  language?: "en" | "bn" | "es" | "fr";
}

const TEXT = {
  en: {
    member: "Member",
    tier: "Tier",
    memberSince: "Member Since",
    validUntil: "Valid Until",
  },
  bn: {
    member: "সদস্য",
    tier: "টায়ার",
    memberSince: "সদস্য থেকে",
    validUntil: "বৈধ থাকবে",
  },
  es: {
    member: "Miembro",
    tier: "Nivel",
    memberSince: "Miembro Desde",
    validUntil: "Válido Hasta",
  },
  fr: {
    member: "Membre",
    tier: "Niveau",
    memberSince: "Membre Depuis",
    validUntil: "Valide Jusqu'au",
  },
};

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Blue: { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500" },
  Bronze: { bg: "bg-orange-600", border: "border-orange-600", text: "text-orange-600" },
  Silver: { bg: "bg-gray-400", border: "border-gray-400", text: "text-gray-400" },
  Gold: { bg: "bg-yellow-500", border: "border-yellow-500", text: "text-yellow-500" },
  Platinum: { bg: "bg-purple-600", border: "border-purple-600", text: "text-purple-600" },
};

export function VirtualMembershipCard({
  memberName,
  memberNumber,
  tierName,
  tierColor,
  membershipStartDate,
  membershipExpiryDate,
  language = "en",
}: VirtualMembershipCardProps) {
  const t = TEXT[language];
  const colors = TIER_COLORS[tierName] || TIER_COLORS.Blue;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "bn" ? "bn-BD" : language === "es" ? "es-ES" : language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className={`relative overflow-hidden border-2 ${colors.border} shadow-lg`}>
      {/* Tier Color Accent */}
      <div className={`absolute top-0 left-0 right-0 h-2 ${colors.bg}`} />

      <CardContent className="pt-8 pb-6 px-6 space-y-6">
        {/* Header with Tier Badge */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t.member}</p>
            <h3 className="text-2xl font-bold text-foreground">{memberName}</h3>
            <p className="text-sm text-muted-foreground mt-1">#{memberNumber.toString().padStart(6, "0")}</p>
          </div>
          <Badge className={`${colors.bg} text-white border-0 px-3 py-1 text-sm font-semibold`}>
            <Award className="h-3 w-3 mr-1" />
            {tierName}
          </Badge>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Membership Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <p className="text-xs">{t.memberSince}</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{formatDate(membershipStartDate)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              <p className="text-xs">{t.validUntil}</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{formatDate(membershipExpiryDate)}</p>
          </div>
        </div>

        {/* Decorative Pattern */}
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
          <div className={`w-full h-full ${colors.bg} rounded-tl-full`} />
        </div>
      </CardContent>
    </Card>
  );
}