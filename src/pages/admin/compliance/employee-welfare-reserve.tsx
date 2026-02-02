import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Copy, CheckCircle2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function EmployeeWelfareReservePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  // Document metadata
  const documentMetadata = {
    country: "Bangladesh",
    countryCode: "BD",
    taxAuthority: "NBR (National Board of Revenue)",
    version: "1.0",
    lastUpdated: "2026-02-01",
    documentType: "Employee Welfare Reserve - Compliance Statement"
  };

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Use any cast to avoid type errors with Supabase client
      const supabaseAny = supabase as any;

      // Check employee table for Chairman, MD, or Accounts roles
      const { data: employee } = await supabaseAny
        .from("employees")
        .select("role_category, department")
        .eq("user_id", user.id)
        .single();

      if (employee) {
        const isChairmanOrMD = ["chairman", "managing_director"].includes(employee.role_category);
        const isAccounts = employee.department === "accounts";

        if (isChairmanOrMD || isAccounts) {
          setAdminRole(employee.role_category || "accounts");
          setLoading(false);
          return;
        }
      }

      // If no employee record or unauthorized role, redirect
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
    const content = document.getElementById("document-content");
    if (content) {
      const text = content.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header - Hidden in print */}
        <div className="mb-6 print:hidden">
          <Button variant="outline" onClick={() => router.push("/admin")}>
            ← Back to Admin Portal
          </Button>
        </div>

        {/* Actions Bar - Hidden in print */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">
            Employee Welfare Reserve
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Text
                </>
              )}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <Card className="p-8 bg-white shadow-sm">
          <div id="document-content" className="prose prose-gray max-w-none">
            {/* Document Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
              <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Employee Welfare Reserve
              </h1>
              <p className="text-lg text-gray-600">
                Founder's Staff Support Fund
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Internal Compliance & Regulatory Reference Document
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mt-3">
                <span><strong>Country:</strong> {documentMetadata.country}</span>
                <span>•</span>
                <span><strong>Version:</strong> {documentMetadata.version}</span>
                <span>•</span>
                <span><strong>Last Updated:</strong> {new Date(documentMetadata.lastUpdated).toLocaleDateString("en-GB")}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tax Authority: {documentMetadata.taxAuthority}
              </p>
            </div>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  1
                </span>
                Purpose of the Fund
              </h2>
              <div className="pl-11 space-y-3 text-gray-700 leading-relaxed">
                <p>
                  The <strong>Employee Welfare Reserve</strong> (also referred to as the <strong>Founder's Staff Support Fund</strong>) is an employer-funded discretionary reserve established to provide long-term welfare support to employees facing extraordinary circumstances.
                </p>
                <p>
                  This fund is designed to assist staff members in cases of:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Severe medical hardship or emergency medical expenses</li>
                  <li>Retirement assistance beyond statutory benefits</li>
                  <li>Humanitarian support in exceptional personal crises</li>
                  <li>Recognition of long-term service and loyalty</li>
                </ul>
                <p>
                  The fund represents the company's commitment to employee welfare and serves as a safety net for staff members during times of genuine need.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  2
                </span>
                Funding Source
              </h2>
              <div className="pl-11 space-y-3 text-gray-700 leading-relaxed">
                <p>
                  The Employee Welfare Reserve is funded <strong>100% by the company</strong> as an employer contribution. This is a critical distinction for accounting and tax purposes:
                </p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
                  <p className="font-semibold text-green-900 mb-2">Key Funding Principles:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>No employee salary deductions:</strong> Employees do not contribute to this fund</li>
                    <li><strong>Not shown on payslips:</strong> This is not a deduction or benefit line item</li>
                    <li><strong>Company discretionary contribution:</strong> Funding levels are determined by management</li>
                    <li><strong>Independent of payroll:</strong> Not calculated as a percentage of salary</li>
                  </ul>
                </div>
                <p>
                  The company allocates funds to this reserve as part of its internal welfare policy, separate from statutory benefits such as provident fund, gratuity, or other legally mandated contributions.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  3
                </span>
                Accounting Treatment
              </h2>
              <div className="pl-11 space-y-3 text-gray-700 leading-relaxed">
                <p>
                  For financial reporting and audit purposes, the Employee Welfare Reserve is treated as follows:
                </p>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                  <p className="font-semibold text-purple-900 mb-2">Accounting Classification:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Company reserve / provision:</strong> Recorded as a liability on the company's balance sheet</li>
                    <li><strong>Not an employee liability:</strong> Employees have no legal claim or ownership of these funds</li>
                    <li><strong>Separate from payroll expenses:</strong> Not included in monthly payroll accounting entries</li>
                    <li><strong>Discretionary disbursement only:</strong> Released only upon management approval for specific cases</li>
                  </ul>
                </div>
                <p>
                  <strong>Journal Entry Treatment:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>When funded:</strong> Dr. Welfare Fund Expense / Cr. Employee Welfare Reserve (Liability)</li>
                  <li><strong>When disbursed:</strong> Dr. Employee Welfare Reserve (Liability) / Cr. Cash/Bank</li>
                </ul>
                <p>
                  This reserve is maintained separately from employee provident fund, gratuity provisions, and other statutory liabilities to ensure clear financial reporting and compliance with accounting standards.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  4
                </span>
                Governance & Controls
              </h2>
              <div className="pl-11 space-y-3 text-gray-700 leading-relaxed">
                <p>
                  Strict governance controls are maintained to ensure proper administration and prevent misuse:
                </p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                  <p className="font-semibold text-red-900 mb-2">Approval Requirements:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Dual approval required:</strong> All disbursements must be approved by both the Managing Director AND Chairman</li>
                    <li><strong>Case-by-case review:</strong> Each request is evaluated individually based on merit and circumstances</li>
                    <li><strong>Documentation required:</strong> Supporting evidence (medical bills, retirement documentation, etc.) must be provided</li>
                    <li><strong>Full audit trail:</strong> All approvals, disbursements, and rejections are logged in the system</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
                  <p className="font-semibold text-yellow-900 mb-2">Access Restrictions:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>No employee access:</strong> Employees cannot view their reserve balance or request disbursements directly</li>
                    <li><strong>No employee visibility:</strong> Reserve balances are not displayed on payslips, portals, or employee documents</li>
                    <li><strong>Admin-only visibility:</strong> Only authorized administrators (Chairman, MD, Master Admin, Accounts) can view reserve data</li>
                    <li><strong>HR escalation pathway:</strong> Requests must be initiated by HR department on behalf of employees</li>
                  </ul>
                </div>
                <p>
                  These controls ensure that the fund is administered fairly, transparently, and in accordance with the company's welfare policy objectives.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  5
                </span>
                Eligibility & Disbursement
              </h2>
              <div className="pl-11 space-y-3 text-gray-700 leading-relaxed">
                <p>
                  The Employee Welfare Reserve operates on a <strong>discretionary basis only</strong>. Key eligibility principles include:
                </p>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 my-4">
                  <p className="font-semibold text-orange-900 mb-2">Eligibility Criteria:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>No automatic entitlement:</strong> Employees do not have a contractual right to these funds</li>
                    <li><strong>Management discretion:</strong> Approval is based on case merit, company policy, and available funds</li>
                    <li><strong>Service consideration:</strong> Length of service and employment record may be considered</li>
                    <li><strong>Genuine need:</strong> Requests must demonstrate legitimate hardship or welfare need</li>
                  </ul>
                </div>
                <div className="bg-gray-50 border-l-4 border-gray-500 p-4 my-4">
                  <p className="font-semibold text-gray-900 mb-2">Forfeiture Conditions:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Misconduct termination:</strong> Funds are forfeited in cases of termination for serious misconduct</li>
                    <li><strong>Fraud or dishonesty:</strong> Any fraudulent claims result in immediate forfeiture</li>
                    <li><strong>Voluntary resignation:</strong> Forfeited unless approved by management for retirement cases</li>
                    <li><strong>Dismissal for cause:</strong> All accumulated reserves are forfeited upon dismissal</li>
                  </ul>
                </div>
                <p>
                  Disbursements are made directly to the employee or service provider (e.g., hospital) and are documented with full supporting evidence. Once disbursed, amounts are deducted from the reserve balance and recorded as expenses in the company's accounts.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  6
                </span>
                Regulatory Position
              </h2>
              <div className="pl-11 space-y-3 text-gray-700 leading-relaxed">
                <p>
                  The Employee Welfare Reserve has been established in accordance with the following regulatory and tax principles:
                </p>
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4">
                  <p className="font-semibold text-indigo-900 mb-2">Tax & Regulatory Treatment:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Not a statutory benefit:</strong> This is not a legally mandated benefit under Bangladesh labor law</li>
                    <li><strong>Not taxable as income:</strong> Undisbursed reserves are not taxable to employees (no constructive receipt)</li>
                    <li><strong>Taxable upon disbursement:</strong> When disbursed, amounts may be taxable depending on the nature of payment and prevailing tax law</li>
                    <li><strong>Company expense deduction:</strong> Disbursements are tax-deductible business expenses for the company</li>
                    <li><strong>NBR compliance:</strong> Maintained in accordance with National Board of Revenue (NBR) guidelines for employee welfare provisions</li>
                  </ul>
                </div>
                <p>
                  <strong>Audit & Compliance:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>This fund is subject to annual audit review alongside other company provisions</li>
                  <li>All documentation is available for NBR or external auditor inspection</li>
                  <li>The company maintains full records of contributions, approvals, and disbursements</li>
                  <li>Reserve balances are disclosed in annual financial statements as a company liability</li>
                </ul>
                <p>
                  The company's welfare policy is designed to comply with all applicable labor laws, tax regulations, and accounting standards while providing meaningful support to employees in times of need.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-500">
              <p className="mb-2">
                <strong>Document Type:</strong> Internal Compliance & Regulatory Reference
              </p>
              <p className="mb-2">
                <strong>Access:</strong> Chairman, Managing Director, Master Admin, Accounts (Read-Only)
              </p>
              <p className="mb-2">
                <strong>Employee Visibility:</strong> Not Accessible to Employees
              </p>
              <p className="text-xs text-gray-400 mt-4">
                This document is for internal regulatory explanation purposes only and does not create any contractual rights or obligations.
              </p>
            </div>
          </div>
        </Card>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
            }
            .print\\:hidden {
              display: none !important;
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