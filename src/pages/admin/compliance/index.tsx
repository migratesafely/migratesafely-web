import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Calculator, Heart, Receipt, ClipboardCheck, Shield, Globe } from "lucide-react";
import { MainHeader } from "@/components/MainHeader";

const supabaseAny = supabase as any;

interface ComplianceSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: "active" | "coming-soon";
  link: string | null;
}

interface CountryCompliance {
  countryCode: string;
  countryName: string;
  taxAuthority: string;
  status: "active" | "inactive";
  sections: ComplianceSection[];
}

export default function ComplianceHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabaseAny.auth.getUser();
      
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: profile } = await supabaseAny
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "super_admin" || profile?.role === "manager_admin") {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const { data: employee } = await supabaseAny
        .from("employees")
        .select("role_category, department")
        .eq("user_id", user.id)
        .single();

      if (
        employee?.role_category === "chairman" ||
        employee?.role_category === "managing_director" ||
        employee?.department === "accounts"
      ) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch (error) {
      console.error("Access check error:", error);
      router.push("/admin/login");
    }
  };

  // Country-agnostic compliance framework
  const countryCompliance: CountryCompliance[] = [
    {
      countryCode: "BD",
      countryName: "Bangladesh",
      taxAuthority: "NBR (National Board of Revenue)",
      status: "active",
      sections: [
        {
          id: "payroll",
          title: "Payroll & Salary Compliance",
          description: "Salary processing, payslips, bank transfers, and payroll records",
          icon: Calculator,
          status: "active",
          link: "/admin/compliance/payroll-tax",
        },
        {
          id: "tax",
          title: "Tax & Regulatory Compliance (NBR)",
          description: "Tax handling, filings, audit readiness, and regulatory reporting",
          icon: FileText,
          status: "coming-soon",
          link: null,
        },
        {
          id: "welfare",
          title: "Employee Welfare & Reserve Fund",
          description: "Employer-funded staff welfare reserve and governance documentation",
          icon: Heart,
          status: "active",
          link: "/admin/compliance/employee-welfare-reserve",
        },
        {
          id: "expenses",
          title: "Expense & Accounting Controls",
          description: "Expense approvals, payment tracking, and audit trails",
          icon: Receipt,
          status: "coming-soon",
          link: null,
        },
        {
          id: "audit",
          title: "Audit & Reporting",
          description: "Internal and external audit readiness, compliance reports",
          icon: ClipboardCheck,
          status: "coming-soon",
          link: null,
        },
      ],
    },
    {
      countryCode: "IN",
      countryName: "India",
      taxAuthority: "CBDT (Central Board of Direct Taxes)",
      status: "inactive",
      sections: [],
    },
    {
      countryCode: "GB",
      countryName: "United Kingdom",
      taxAuthority: "HMRC (Her Majesty's Revenue and Customs)",
      status: "inactive",
      sections: [],
    },
    {
      countryCode: "EU",
      countryName: "European Union",
      taxAuthority: "Various EU Tax Authorities",
      status: "inactive",
      sections: [],
    },
  ];

  const activeCountries = countryCompliance.filter((c) => c.status === "active");
  const inactiveCountries = countryCompliance.filter((c) => c.status === "inactive");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin")}
            className="mb-4 hover:bg-slate-200"
          >
            ← Back to Admin Portal
          </Button>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Compliance & Governance Hub</h1>
                <p className="text-slate-600 mt-1">
                  Multi-country regulatory documentation, audit readiness, and internal controls
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Countries */}
        {activeCountries.map((country) => (
          <div key={country.countryCode} className="mb-12">
            {/* Country Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {country.countryName}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Tax Authority: <strong>{country.taxAuthority}</strong>
                  </p>
                </div>
                <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                  Active Jurisdiction
                </Badge>
              </div>
            </div>

            {/* Compliance Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {country.sections.map((section) => {
                const IconComponent = section.icon;
                const isActive = section.status === "active";
                const isComingSoon = section.status === "coming-soon";

                return (
                  <Card
                    key={section.id}
                    className={`hover:shadow-lg transition-all duration-200 ${
                      isActive ? "border-green-200 bg-gradient-to-br from-white to-green-50" : ""
                    } ${isComingSoon ? "opacity-75" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-3 rounded-lg ${
                          isActive ? "bg-green-100" : "bg-slate-100"
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            isActive ? "text-green-600" : "text-slate-600"
                          }`} />
                        </div>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={`${
                            isActive
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isActive ? "Active" : "Coming Soon"}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-slate-900">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isActive && section.link ? (
                        <Button
                          onClick={() => router.push(section.link)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          View Documentation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          disabled
                          variant="outline"
                          className="w-full cursor-not-allowed"
                        >
                          Not Available Yet
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* Inactive Countries (Placeholder) */}
        {inactiveCountries.length > 0 && (
          <div className="mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Globe className="h-6 w-6 text-slate-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Additional Jurisdictions
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
                    The following jurisdictions can be activated when operations expand to these regions.
                    Each jurisdiction will have its own compliance documentation structure.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {inactiveCountries.map((country) => (
                      <div
                        key={country.countryCode}
                        className="bg-white border border-slate-200 rounded-lg p-4"
                      >
                        <h3 className="font-semibold text-slate-900">{country.countryName}</h3>
                        <p className="text-xs text-slate-500 mt-1">{country.taxAuthority}</p>
                        <Badge variant="secondary" className="mt-3 bg-slate-100 text-slate-600 border-slate-200">
                          Inactive
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Framework:</strong> This compliance hub is built with a country-agnostic architecture.
            New jurisdictions (India, UK, EU, etc.) can be activated without code changes. All compliance
            documents are admin-only and designed for regulatory audits, internal reviews, and executive reference.
          </p>
        </div>
      </div>
    </div>
  );
}