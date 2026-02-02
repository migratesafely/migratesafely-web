import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Shield, AlertTriangle, Info, DollarSign, CheckCircle } from "lucide-react";

interface LoyaltyProgramInfoProps {
  language?: "en" | "bn" | "es" | "fr";
}

const TEXT = {
  en: {
    title: "Loyalty Program - How It Works",
    description: "Understand how you earn rewards through our referral-based loyalty tiers",
    overview: {
      title: "Program Overview",
      point1: "The Migratesafely.com Loyalty Program rewards active members for successful referrals",
      point2: "Tier progression is based on the number of successful referrals you make",
      point3: "Higher tiers unlock additional bonus percentages on your referral rewards",
      point4: "All tier bonuses are separate from and additive to your base referral bonuses",
    },
    howItWorks: {
      title: "How Tier Bonuses Work",
      step1: {
        title: "Earn Referral Bonuses",
        description: "When someone joins using your referral code and completes payment, you receive a base referral bonus automatically credited to your wallet.",
      },
      step2: {
        title: "Achieve Tier Status",
        description: "As you accumulate successful referrals, you automatically progress through loyalty tiers (Blue → Bronze → Silver → Gold → Platinum).",
      },
      step3: {
        title: "Tier Bonus Calculation",
        description: "Tier bonuses are calculated as a percentage of your original referral bonus. For example, if Silver tier offers 5% and your referral bonus is $50, your tier bonus would be $2.50.",
      },
      step4: {
        title: "Admin Approval Required",
        description: "All tier bonuses require manual review and approval by our admin team before being credited to your wallet. This ensures program integrity and compliance.",
      },
    },
    separation: {
      title: "System Independence",
      description: "Our systems operate independently to ensure fairness:",
      point1: "Referral bonuses are paid automatically upon successful referrals",
      point2: "Tier bonuses require separate admin approval",
      point3: "Prize draws are completely independent and based solely on active membership",
      point4: "Each system has its own rules, eligibility, and payment workflows",
    },
    compliance: {
      title: "Tax & Legal Compliance Notice",
      warning: "IMPORTANT: Tax Responsibility",
      point1: "Referral bonuses and tier bonuses may be subject to income tax in your jurisdiction",
      point2: "You are solely responsible for declaring and paying any applicable taxes on bonuses received",
      point3: "Migratesafely.com does not provide tax advice or file tax returns on your behalf",
      point4: "Prize draw winnings (if any) may also be subject to local tax laws and regulations",
      point5: "Consult a qualified tax professional in your country for guidance on your obligations",
    },
    antiAbuse: {
      title: "Anti-Abuse & Governance",
      description: "To maintain program integrity, we enforce strict rules:",
      point1: "Referral or tier bonuses may be suspended or revoked if misuse, fraud, or manipulation is detected",
      point2: "Tier status may be adjusted following investigation by our compliance team",
      point3: "All decisions are governed by admin review and maintained in immutable audit logs",
      point4: "Members found violating program rules may face account suspension or termination",
      point5: "Examples of prohibited conduct: fake referrals, self-referrals, coordinated abuse, fraudulent payments",
    },
    programChanges: {
      title: "Program Changes & Amendments",
      description: "Loyalty Program rules may evolve over time:",
      point1: "Tier structures, bonus percentages, and qualification thresholds may be amended by management",
      point2: "Members will be notified of any changes in advance via email and dashboard notifications",
      point3: "Changes take effect only from your next membership renewal period (never retroactively)",
      point4: "Already-earned bonuses are never reduced or revoked due to program changes",
      point5: "Existing tier achievements are honored until your membership expiry date",
      point6: "Program changes are managed by Super Admin with full audit trail",
    },
    note: {
      title: "Important Notes",
      point1: "This information is for member guidance only and does not constitute a legally binding contract",
      point2: "Refer to the Member User Agreement, Terms of Service, and Privacy Policy for full legal terms",
      point3: "Migratesafely.com reserves the right to interpret and enforce loyalty program rules",
      point4: "All bonus payments are subject to available funds and operational capacity",
    },
  },
  bn: {
    title: "লয়্যালটি প্রোগ্রাম - কিভাবে কাজ করে",
    description: "আমাদের রেফারেল-ভিত্তিক লয়্যালটি টায়ারের মাধ্যমে আপনি কীভাবে পুরস্কার অর্জন করেন তা বুঝুন",
    overview: {
      title: "প্রোগ্রাম সংক্ষিপ্ত বিবরণ",
      point1: "Migratesafely.com লয়্যালটি প্রোগ্রাম সফল রেফারেলের জন্য সক্রিয় সদস্যদের পুরস্কৃত করে",
      point2: "টায়ার অগ্রগতি আপনার সফল রেফারেলের সংখ্যার উপর ভিত্তি করে",
      point3: "উচ্চতর টায়ার আপনার রেফারেল পুরস্কারে অতিরিক্ত বোনাস শতাংশ আনলক করে",
      point4: "সমস্ত টায়ার বোনাস আপনার বেস রেফারেল বোনাস থেকে আলাদা এবং সংযোজিত",
    },
    howItWorks: {
      title: "টায়ার বোনাস কিভাবে কাজ করে",
      step1: {
        title: "রেফারেল বোনাস অর্জন করুন",
        description: "যখন কেউ আপনার রেফারেল কোড ব্যবহার করে যোগদান করে এবং পেমেন্ট সম্পূর্ণ করে, আপনি স্বয়ংক্রিয়ভাবে আপনার ওয়ালেটে একটি বেস রেফারেল বোনাস পান।",
      },
      step2: {
        title: "টায়ার স্ট্যাটাস অর্জন করুন",
        description: "যখন আপনি সফল রেফারেল সংগ্রহ করেন, আপনি স্বয়ংক্রিয়ভাবে লয়্যালটি টায়ারের মাধ্যমে অগ্রসর হন (Blue → Bronze → Silver → Gold → Platinum)।",
      },
      step3: {
        title: "টায়ার বোনাস গণনা",
        description: "টায়ার বোনাস আপনার মূল রেফারেল বোনাসের শতাংশ হিসাবে গণনা করা হয়। উদাহরণস্বরূপ, যদি Silver টায়ার 5% অফার করে এবং আপনার রেফারেল বোনাস $50 হয়, তাহলে আপনার টায়ার বোনাস হবে $2.50।",
      },
      step4: {
        title: "অ্যাডমিন অনুমোদন প্রয়োজন",
        description: "সমস্ত টায়ার বোনাস আপনার ওয়ালেটে জমা হওয়ার আগে আমাদের অ্যাডমিন টিম দ্বারা ম্যানুয়াল পর্যালোচনা এবং অনুমোদন প্রয়োজন। এটি প্রোগ্রামের অখণ্ডতা এবং সম্মতি নিশ্চিত করে।",
      },
    },
    separation: {
      title: "সিস্টেম স্বাধীনতা",
      description: "ন্যায্যতা নিশ্চিত করতে আমাদের সিস্টেমগুলি স্বাধীনভাবে কাজ করে:",
      point1: "সফল রেফারেলের পরে রেফারেল বোনাস স্বয়ংক্রিয়ভাবে প্রদান করা হয়",
      point2: "টায়ার বোনাসের জন্য আলাদা অ্যাডমিন অনুমোদন প্রয়োজন",
      point3: "পুরস্কার ড্র সম্পূর্ণ স্বাধীন এবং শুধুমাত্র সক্রিয় সদস্যপদের উপর ভিত্তি করে",
      point4: "প্রতিটি সিস্টেমের নিজস্ব নিয়ম, যোগ্যতা এবং পেমেন্ট ওয়ার্কফ্লো রয়েছে",
    },
    compliance: {
      title: "কর এবং আইনি সম্মতি বিজ্ঞপ্তি",
      warning: "গুরুত্বপূর্ণ: কর দায়িত্ব",
      point1: "রেফারেল বোনাস এবং টায়ার বোনাস আপনার এলাকায় আয়কর সাপেক্ষে হতে পারে",
      point2: "প্রাপ্ত বোনাসের উপর যেকোনো প্রযোজ্য কর ঘোষণা এবং প্রদানের জন্য আপনি একা দায়ী",
      point3: "Migratesafely.com কর পরামর্শ প্রদান করে না বা আপনার পক্ষে কর রিটার্ন ফাইল করে না",
      point4: "পুরস্কার ড্র জয় (যদি থাকে) স্থানীয় কর আইন এবং নিয়মের সাপেক্ষে হতে পারে",
      point5: "আপনার বাধ্যবাধকতা সম্পর্কে নির্দেশনার জন্য আপনার দেশে একজন যোগ্য কর পেশাদারের সাথে পরামর্শ করুন",
    },
    antiAbuse: {
      title: "অপব্যবহার-বিরোধী এবং শাসন",
      description: "প্রোগ্রামের অখণ্ডতা বজায় রাখতে, আমরা কঠোর নিয়ম প্রয়োগ করি:",
      point1: "অপব্যবহার, জালিয়াতি বা হেরফের সনাক্ত হলে রেফারেল বা টায়ার বোনাস স্থগিত বা প্রত্যাহার করা হতে পারে",
      point2: "আমাদের সম্মতি টিম দ্বারা তদন্তের পরে টায়ার স্ট্যাটাস সামঞ্জস্য করা হতে পারে",
      point3: "সমস্ত সিদ্ধান্ত অ্যাডমিন পর্যালোচনা দ্বারা পরিচালিত এবং অপরিবর্তনীয় অডিট লগে রক্ষণাবেক্ষণ করা হয়",
      point4: "প্রোগ্রাম নিয়ম লঙ্ঘনকারী সদস্যরা অ্যাকাউন্ট স্থগিতাদেশ বা সমাপ্তির সম্মুখীন হতে পারেন",
      point5: "নিষিদ্ধ আচরণের উদাহরণ: জাল রেফারেল, স্ব-রেফারেল, সমন্বিত অপব্যবহার, প্রতারণামূলক পেমেন্ট",
    },
    programChanges: {
      title: "প্রোগ্রাম পরিবর্তন এবং সংশোধন",
      description: "সময়ের সাথে সাথে লয়্যালটি প্রোগ্রামের নিয়ম বিকশিত হতে পারে:",
      point1: "টায়ার কাঠামো, বোনাস শতাংশ এবং যোগ্যতার থ্রেশহোল্ড ব্যবস্থাপনা দ্বারা সংশোধিত হতে পারে",
      point2: "সদস্যদের ইমেল এবং ড্যাশবোর্ড বিজ্ঞপ্তির মাধ্যমে যেকোনো পরিবর্তনের আগাম জানানো হবে",
      point3: "পরিবর্তনগুলি শুধুমাত্র আপনার পরবর্তী সদস্যপদ নবায়ন সময়কাল থেকে কার্যকর হয় (কখনও পূর্ববর্তীভাবে নয়)",
      point4: "ইতিমধ্যে-অর্জিত বোনাস প্রোগ্রাম পরিবর্তনের কারণে কখনই হ্রাস বা প্রত্যাহার করা হয় না",
      point5: "বিদ্যমান টায়ার অর্জনগুলি আপনার সদস্যপদ মেয়াদ শেষ হওয়ার তারিখ পর্যন্ত সম্মানিত হয়",
      point6: "প্রোগ্রাম পরিবর্তনগুলি সম্পূর্ণ অডিট ট্রেইল সহ সুপার অ্যাডমিন দ্বারা পরিচালিত হয়",
    },
    note: {
      title: "গুরুত্বপূর্ণ নোট",
      point1: "এই তথ্যটি শুধুমাত্র সদস্য নির্দেশনার জন্য এবং আইনগতভাবে বাধ্যতামূলক চুক্তি গঠন করে না",
      point2: "সম্পূর্ণ আইনি শর্তাবলীর জন্য সদস্য ব্যবহারকারী চুক্তি, পরিষেবার শর্তাবলী এবং গোপনীয়তা নীতি দেখুন",
      point3: "Migratesafely.com লয়্যালটি প্রোগ্রাম নিয়ম ব্যাখ্যা এবং প্রয়োগ করার অধিকার সংরক্ষণ করে",
      point4: "সমস্ত বোনাস পেমেন্ট উপলব্ধ তহবিল এবং অপারেশনাল ক্ষমতা সাপেক্ষে",
    },
  },
  es: {
    title: "Programa de Lealtad - Cómo Funciona",
    description: "Entiende cómo ganas recompensas a través de nuestros niveles de lealtad basados en referencias",
    overview: {
      title: "Resumen del Programa",
      point1: "El Programa de Lealtad de Migratesafely.com recompensa a miembros activos por referencias exitosas",
      point2: "La progresión de niveles se basa en el número de referencias exitosas que haces",
      point3: "Los niveles superiores desbloquean porcentajes de bonificación adicionales en tus recompensas de referencia",
      point4: "Todas las bonificaciones de nivel son separadas y adicionales a tus bonificaciones de referencia base",
    },
    howItWorks: {
      title: "Cómo Funcionan las Bonificaciones de Nivel",
      step1: {
        title: "Gana Bonificaciones de Referencia",
        description: "Cuando alguien se une usando tu código de referencia y completa el pago, recibes una bonificación de referencia base acreditada automáticamente a tu billetera.",
      },
      step2: {
        title: "Alcanza el Estado de Nivel",
        description: "A medida que acumulas referencias exitosas, progresas automáticamente a través de niveles de lealtad (Blue → Bronze → Silver → Gold → Platinum).",
      },
      step3: {
        title: "Cálculo de Bonificación de Nivel",
        description: "Las bonificaciones de nivel se calculan como un porcentaje de tu bonificación de referencia original. Por ejemplo, si el nivel Silver ofrece 5% y tu bonificación de referencia es $50, tu bonificación de nivel sería $2.50.",
      },
      step4: {
        title: "Aprobación de Administrador Requerida",
        description: "Todas las bonificaciones de nivel requieren revisión manual y aprobación de nuestro equipo de administradores antes de ser acreditadas a tu billetera. Esto asegura la integridad del programa y el cumplimiento.",
      },
    },
    separation: {
      title: "Independencia del Sistema",
      description: "Nuestros sistemas operan de forma independiente para asegurar la equidad:",
      point1: "Las bonificaciones de referencia se pagan automáticamente tras referencias exitosas",
      point2: "Las bonificaciones de nivel requieren aprobación de administrador separada",
      point3: "Los sorteos de premios son completamente independientes y basados únicamente en membresía activa",
      point4: "Cada sistema tiene sus propias reglas, elegibilidad y flujos de pago",
    },
    compliance: {
      title: "Aviso de Cumplimiento Legal y Fiscal",
      warning: "IMPORTANTE: Responsabilidad Fiscal",
      point1: "Las bonificaciones de referencia y nivel pueden estar sujetas a impuestos sobre la renta en tu jurisdicción",
      point2: "Eres el único responsable de declarar y pagar cualquier impuesto aplicable sobre las bonificaciones recibidas",
      point3: "Migratesafely.com no proporciona asesoramiento fiscal ni presenta declaraciones de impuestos en tu nombre",
      point4: "Las ganancias de sorteos de premios (si las hay) también pueden estar sujetas a leyes y regulaciones fiscales locales",
      point5: "Consulta a un profesional fiscal calificado en tu país para obtener orientación sobre tus obligaciones",
    },
    antiAbuse: {
      title: "Anti-Abuso y Gobernanza",
      description: "Para mantener la integridad del programa, aplicamos reglas estrictas:",
      point1: "Las bonificaciones de referencia o nivel pueden ser suspendidas o revocadas si se detecta mal uso, fraude o manipulación",
      point2: "El estado de nivel puede ser ajustado tras investigación por nuestro equipo de cumplimiento",
      point3: "Todas las decisiones son gobernadas por revisión de administrador y mantenidas en registros de auditoría inmutables",
      point4: "Los miembros que violen las reglas del programa pueden enfrentar suspensión o terminación de cuenta",
      point5: "Ejemplos de conducta prohibida: referencias falsas, auto-referencias, abuso coordinado, pagos fraudulentos",
    },
    programChanges: {
      title: "Cambios y Enmiendas del Programa",
      description: "Las reglas del Programa de Lealtad pueden evolucionar con el tiempo:",
      point1: "Las estructuras de niveles, porcentajes de bonificación y umbrales de calificación pueden ser enmendados por la gerencia",
      point2: "Los miembros serán notificados de cualquier cambio con anticipación por correo electrónico y notificaciones del panel",
      point3: "Los cambios entran en vigor solo a partir de tu próximo período de renovación de membresía (nunca retroactivamente)",
      point4: "Las bonificaciones ya ganadas nunca se reducen o revocan debido a cambios del programa",
      point5: "Los logros de nivel existentes se honran hasta tu fecha de expiración de membresía",
      point6: "Los cambios del programa son gestionados por Super Admin con registro de auditoría completo",
    },
    note: {
      title: "Notas Importantes",
      point1: "Esta información es solo para orientación de miembros y no constituye un contrato legalmente vinculante",
      point2: "Consulta el Acuerdo de Usuario de Miembro, Términos de Servicio y Política de Privacidad para términos legales completos",
      point3: "Migratesafely.com se reserva el derecho de interpretar y hacer cumplir las reglas del programa de lealtad",
      point4: "Todos los pagos de bonificación están sujetos a fondos disponibles y capacidad operativa",
    },
  },
  fr: {
    title: "Programme de Fidélité - Comment Ça Marche",
    description: "Comprenez comment vous gagnez des récompenses grâce à nos niveaux de fidélité basés sur les parrainages",
    overview: {
      title: "Aperçu du Programme",
      point1: "Le Programme de Fidélité de Migratesafely.com récompense les membres actifs pour les parrainages réussis",
      point2: "La progression des niveaux est basée sur le nombre de parrainages réussis que vous effectuez",
      point3: "Les niveaux supérieurs débloquent des pourcentages de bonus supplémentaires sur vos récompenses de parrainage",
      point4: "Tous les bonus de niveau sont séparés et additifs à vos bonus de parrainage de base",
    },
    howItWorks: {
      title: "Comment Fonctionnent les Bonus de Niveau",
      step1: {
        title: "Gagnez des Bonus de Parrainage",
        description: "Lorsque quelqu'un rejoint en utilisant votre code de parrainage et effectue le paiement, vous recevez un bonus de parrainage de base automatiquement crédité sur votre portefeuille.",
      },
      step2: {
        title: "Atteignez le Statut de Niveau",
        description: "Au fur et à mesure que vous accumulez des parrainages réussis, vous progressez automatiquement à travers les niveaux de fidélité (Blue → Bronze → Silver → Gold → Platinum).",
      },
      step3: {
        title: "Calcul du Bonus de Niveau",
        description: "Les bonus de niveau sont calculés en pourcentage de votre bonus de parrainage original. Par exemple, si le niveau Silver offre 5% et que votre bonus de parrainage est de 50$, votre bonus de niveau serait de 2,50$.",
      },
      step4: {
        title: "Approbation de l'Administrateur Requise",
        description: "Tous les bonus de niveau nécessitent une révision manuelle et l'approbation de notre équipe d'administration avant d'être crédités sur votre portefeuille. Cela garantit l'intégrité du programme et la conformité.",
      },
    },
    separation: {
      title: "Indépendance du Système",
      description: "Nos systèmes fonctionnent de manière indépendante pour assurer l'équité:",
      point1: "Les bonus de parrainage sont payés automatiquement après des parrainages réussis",
      point2: "Les bonus de niveau nécessitent une approbation d'administrateur séparée",
      point3: "Les tirages au sort sont complètement indépendants et basés uniquement sur l'adhésion active",
      point4: "Chaque système a ses propres règles, son éligibilité et ses flux de paiement",
    },
    compliance: {
      title: "Avis de Conformité Fiscale et Légale",
      warning: "IMPORTANT: Responsabilité Fiscale",
      point1: "Les bonus de parrainage et de niveau peuvent être soumis à l'impôt sur le revenu dans votre juridiction",
      point2: "Vous êtes seul responsable de déclarer et de payer tout impôt applicable sur les bonus reçus",
      point3: "Migratesafely.com ne fournit pas de conseils fiscaux ni ne dépose de déclarations fiscales en votre nom",
      point4: "Les gains de tirages au sort (le cas échéant) peuvent également être soumis aux lois et réglementations fiscales locales",
      point5: "Consultez un professionnel fiscal qualifié dans votre pays pour obtenir des conseils sur vos obligations",
    },
    antiAbuse: {
      title: "Anti-Abus et Gouvernance",
      description: "Pour maintenir l'intégrité du programme, nous appliquons des règles strictes:",
      point1: "Les bonus de parrainage ou de niveau peuvent être suspendus ou révoqués si un abus, une fraude ou une manipulation est détecté",
      point2: "Le statut de niveau peut être ajusté suite à une enquête par notre équipe de conformité",
      point3: "Toutes les décisions sont régies par l'examen de l'administrateur et conservées dans des journaux d'audit immuables",
      point4: "Les membres qui enfreignent les règles du programme peuvent faire face à une suspension ou une résiliation de compte",
      point5: "Exemples de conduite interdite: faux parrainages, auto-parrainages, abus coordonné, paiements frauduleux",
    },
    programChanges: {
      title: "Changements et Amendements du Programme",
      description: "Les règles du Programme de Fidélité peuvent évoluer avec le temps:",
      point1: "Les structures de niveaux, les pourcentages de bonus et les seuils de qualification peuvent être modifiés par la direction",
      point2: "Les membres seront informés de tout changement à l'avance par e-mail et notifications du tableau de bord",
      point3: "Les changements prennent effet uniquement à partir de votre prochaine période de renouvellement d'adhésion (jamais rétroactivement)",
      point4: "Les bonus déjà gagnés ne sont jamais réduits ou révoqués en raison de changements de programme",
      point5: "Les réalisations de niveau existantes sont honorées jusqu'à votre date d'expiration d'adhésion",
      point6: "Les changements de programme sont gérés par Super Admin avec une piste d'audit complète",
    },
    note: {
      title: "Notes Importantes",
      point1: "Ces informations sont uniquement destinées à l'orientation des membres et ne constituent pas un contrat juridiquement contraignant",
      point2: "Consultez l'Accord d'Utilisateur de Membre, les Conditions de Service et la Politique de Confidentialité pour les conditions juridiques complètes",
      point3: "Migratesafely.com se réserve le droit d'interpréter et d'appliquer les règles du programme de fidélité",
      point4: "Tous les paiements de bonus sont soumis aux fonds disponibles et à la capacité opérationnelle",
    },
  },
};

export function LoyaltyProgramInfo({ language = "en" }: LoyaltyProgramInfoProps) {
  const t = TEXT[language];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription className="text-base">{t.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Program Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            {t.overview.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{t.overview.point1}</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{t.overview.point2}</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{t.overview.point3}</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{t.overview.point4}</p>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t.howItWorks.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">1</Badge>
              <h4 className="font-semibold text-sm">{t.howItWorks.step1.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-8">{t.howItWorks.step1.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">2</Badge>
              <h4 className="font-semibold text-sm">{t.howItWorks.step2.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-8">{t.howItWorks.step2.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">3</Badge>
              <h4 className="font-semibold text-sm">{t.howItWorks.step3.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-8">{t.howItWorks.step3.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0">4</Badge>
              <h4 className="font-semibold text-sm">{t.howItWorks.step4.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground ml-8">{t.howItWorks.step4.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* System Independence */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t.separation.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">{t.separation.description}</p>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">{t.separation.point1}</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">{t.separation.point2}</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">{t.separation.point3}</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">{t.separation.point4}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Legal Compliance */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            {t.compliance.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="border-yellow-300 bg-yellow-100 dark:bg-yellow-900 dark:border-yellow-700">
            <DollarSign className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
            <AlertDescription className="font-semibold text-yellow-900 dark:text-yellow-100">
              {t.compliance.warning}
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">• {t.compliance.point1}</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">• {t.compliance.point2}</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">• {t.compliance.point3}</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">• {t.compliance.point4}</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold">• {t.compliance.point5}</p>
          </div>
        </CardContent>
      </Card>

      {/* Anti-Abuse & Governance */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            {t.antiAbuse.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">{t.antiAbuse.description}</p>
          <div className="space-y-2">
            <p className="text-sm text-red-800 dark:text-red-200">• {t.antiAbuse.point1}</p>
            <p className="text-sm text-red-800 dark:text-red-200">• {t.antiAbuse.point2}</p>
            <p className="text-sm text-red-800 dark:text-red-200">• {t.antiAbuse.point3}</p>
            <p className="text-sm text-red-800 dark:text-red-200">• {t.antiAbuse.point4}</p>
            <p className="text-sm text-red-800 dark:text-red-200 font-semibold">• {t.antiAbuse.point5}</p>
          </div>
        </CardContent>
      </Card>

      {/* Program Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {t.programChanges.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">{t.programChanges.description}</p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">• {t.programChanges.point1}</p>
            <p className="text-sm text-muted-foreground">• {t.programChanges.point2}</p>
            <p className="text-sm text-muted-foreground">• {t.programChanges.point3}</p>
            <p className="text-sm text-muted-foreground font-semibold">• {t.programChanges.point4}</p>
            <p className="text-sm text-muted-foreground">• {t.programChanges.point5}</p>
            <p className="text-sm text-muted-foreground">• {t.programChanges.point6}</p>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground" />
            {t.note.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">• {t.note.point1}</p>
          <p className="text-xs text-muted-foreground">• {t.note.point2}</p>
          <p className="text-xs text-muted-foreground">• {t.note.point3}</p>
          <p className="text-xs text-muted-foreground">• {t.note.point4}</p>
        </CardContent>
      </Card>
    </div>
  );
}