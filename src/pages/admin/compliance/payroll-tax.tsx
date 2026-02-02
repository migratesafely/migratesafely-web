import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Copy, FileText, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const supabaseAny = supabase as any;

export default function PayrollTaxCompliancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // Document metadata
  const documentMetadata = {
    country: "Bangladesh",
    countryCode: "BD",
    taxAuthority: "NBR (National Board of Revenue)",
    version: "1.0",
    lastUpdated: "2026-02-01",
    documentType: "Payroll & Tax Compliance Statement"
  };

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
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch (error) {
      console.error("Access check error:", error);
      router.push("/admin/login");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const content = document.getElementById("compliance-content")?.innerText || "";
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/compliance")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compliance Hub
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {copySuccess ? "Copied!" : "Copy Text"}
            </Button>
            <Button
              onClick={handlePrint}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              Print Document
            </Button>
          </div>
        </div>

        {/* Document */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 print:shadow-none print:p-0">
          <div id="compliance-content" className="space-y-8">
            {/* Document Header */}
            <div className="text-center pb-6 border-b-2 border-slate-200">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {documentMetadata.documentType}
              </h1>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-slate-600" />
                <p className="text-lg text-slate-700 font-semibold">
                  {documentMetadata.country}
                </p>
              </div>
              <p className="text-slate-600 mb-3">
                Tax Authority: <strong>{documentMetadata.taxAuthority}</strong>
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                <span><strong>Version:</strong> {documentMetadata.version}</span>
                <span>•</span>
                <span><strong>Last Updated:</strong> {new Date(documentMetadata.lastUpdated).toLocaleDateString("en-GB")}</span>
                <span>•</span>
                <span><strong>Document Date:</strong> {new Date().toLocaleDateString("en-GB")}</span>
              </div>
              <Badge className="mt-3 bg-green-100 text-green-700 border-green-200">
                Active Jurisdiction
              </Badge>
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                  1
                </span>
                Payroll Overview
              </h2>
              <div className="pl-10 space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>Payment Method:</strong> All employees are paid exclusively via bank transfer. No cash salary payments are permitted under company policy.
                </p>
                <p>
                  <strong>Payroll Cycle:</strong> Monthly payroll processing cycle with defined cut-off dates for attendance, leave, and adjustments.
                </p>
                <p>
                  <strong>Approval Process:</strong> All salaries are subject to management hierarchy approval before disbursement.
                </p>
                <p>
                  <strong>Transparency:</strong> Payslips are generated for each employee, providing clear breakdowns of earnings and deductions.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                  2
                </span>
                Salary Approval & Governance
              </h2>
              <div className="pl-10 space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>Approval Hierarchy:</strong> Department Head → General Manager → Managing Director → Chairman (as applicable based on role seniority and payroll value).
                </p>
                <p>
                  <strong>Chairman Authorization:</strong> Mandatory approval required for senior management roles and large payroll totals to ensure oversight and governance.
                </p>
                <p>
                  <strong>Audit Trail:</strong> All approvals are digitally recorded with timestamps and approver identifiers for full traceability.
                </p>
                <p>
                  <strong>Segregation of Duties:</strong> Payroll preparation, approval, and disbursement are handled by separate personnel to maintain internal controls.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-bold">
                  3
                </span>
                Payslips & Records
              </h2>
              <div className="pl-10 space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>Generation:</strong> Monthly payslips are generated for each employee upon payroll approval and processing.
                </p>
                <p>
                  <strong>Storage:</strong> Payslips are stored securely in the system with restricted access to authorized personnel only.
                </p>
                <p>
                  <strong>Availability:</strong> Employees can access their own payslips. Management and accounts teams can access all payslips for audit and reference purposes.
                </p>
                <p>
                  <strong>Retention:</strong> Historical payroll records are retained in accordance with legal requirements and company policy for audit readiness.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-orange-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 text-sm font-bold">
                  4
                </span>
                Tax Handling ({documentMetadata.country} – {documentMetadata.taxAuthority.split(" (")[0]})
              </h2>
              <div className="pl-10 space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>Compliance:</strong> Income tax is calculated in accordance with applicable {documentMetadata.country} tax law and {documentMetadata.taxAuthority} guidelines.
                </p>
                <p>
                  <strong>Withholding:</strong> Tax is withheld at source where required by law. Calculations are based on current tax slabs and employee declarations.
                </p>
                <p>
                  <strong>Segregation:</strong> Tax amounts are segregated and tracked separately for onward remittance to {documentMetadata.taxAuthority.split(" (")[0]}.
                </p>
                <p>
                  <strong>Documentation:</strong> All tax-related records, including calculations and remittance proofs, are maintained for regulatory inspection and audit purposes.
                </p>
                <p>
                  <strong>Updates:</strong> Tax policies are reviewed and updated as required to remain compliant with changes in tax law.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-indigo-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                  5
                </span>
                Employer Contributions & Provisions
              </h2>
              <div className="pl-10 space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>Nature:</strong> Employer-funded provisions may exist for employee welfare, long-term benefits, or statutory requirements.
                </p>
                <p>
                  <strong>Not Employee Deductions:</strong> These provisions are funded 100% by the company and are NOT deducted from employee salaries.
                </p>
                <p>
                  <strong>Internal Management:</strong> Such provisions are managed internally under company policy and governance frameworks.
                </p>
                <p>
                  <strong>Disclosure:</strong> These provisions are not itemized on employee payslips as they are not part of employee compensation or deductions.
                </p>
                <p>
                  <strong>Audit:</strong> Full records of employer contributions and provisions are available for internal and external audit.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-red-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                  6
                </span>
                Audit & Compliance
              </h2>
              <div className="pl-10 space-y-2 text-slate-700 leading-relaxed">
                <p>
                  <strong>Audit Readiness:</strong> All payroll records are maintained in an audit-ready format with complete traceability and supporting documentation.
                </p>
                <p>
                  <strong>Reporting:</strong> Payroll reports, summaries, and detailed breakdowns are available on request for management review, internal audit, or external audit.
                </p>
                <p>
                  <strong>Regulatory Standards:</strong> Payroll processes are designed to meet {documentMetadata.taxAuthority} requirements, banking standards, and employment law.
                </p>
                <p>
                  <strong>Internal Controls:</strong> Strong internal controls are maintained including approval workflows, access restrictions, and regular reconciliations.
                </p>
                <p>
                  <strong>Continuous Improvement:</strong> Payroll and tax compliance processes are reviewed periodically and updated to reflect best practices and regulatory changes.
                </p>
              </div>
            </div>

            {/* Audit Disclaimer */}
            <div className="mt-12 pt-6 border-t-2 border-slate-200 bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-900 font-semibold text-center">
                ⚖️ REGULATORY REFERENCE DOCUMENT
              </p>
              <p className="text-sm text-amber-800 text-center mt-2">
                This document is generated for regulatory and audit reference purposes only.
                It is intended for use by authorized personnel, tax authorities, and external auditors.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200">
              <p className="text-sm text-slate-600 text-center">
                This document is for internal compliance reference and regulatory ({documentMetadata.taxAuthority.split(" (")[0]}) inspection purposes only.
              </p>
              <p className="text-sm text-slate-600 text-center mt-2">
                Document prepared for: Chairman, Managing Director, Accounts Department, and authorized auditors.
              </p>
              <p className="text-xs text-slate-500 text-center mt-4">
                MigrateSafely – Production | Compliance & Governance Hub | {documentMetadata.country}
              </p>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body {
              background: white;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:p-0 {
              padding: 0 !important;
            }
            @page {
              margin: 2cm;
            }
          }
        `}</style>
      </div>
    </div>
  );
}