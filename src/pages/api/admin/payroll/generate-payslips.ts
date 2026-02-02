import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { withAuth } from "@/lib/apiMiddleware";
import puppeteer from "puppeteer";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAny = supabase as any;
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { payroll_period_id } = req.body;

    if (!payroll_period_id) {
      return res.status(400).json({ 
        error: "payroll_period_id is required" 
      });
    }

    // Get user details
    const { data: { user }, error: authError } = await supabaseAny.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get employee record to check authorization
    const { data: employee, error: employeeError } = await supabaseAny
      .from("employees")
      .select("id, department, role_category")
      .eq("user_id", user.id)
      .single();

    if (employeeError || !employee) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check authorization (HR, GM, MD, Chairman)
    const hasAuthority = 
      employee.department === "hr" || 
      ["chairman", "managing_director", "general_manager"].includes(employee.role_category);

    if (!hasAuthority) {
      return res.status(403).json({ 
        error: "Only HR or management can generate payslips" 
      });
    }

    // Get payroll period details
    const { data: period, error: periodError } = await supabaseAny
      .from("payroll_periods")
      .select("*")
      .eq("id", payroll_period_id)
      .single();

    if (periodError || !period) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    // Verify period is approved or locked
    if (!["approved", "locked"].includes(period.status)) {
      return res.status(400).json({ 
        error: "Payroll must be approved before generating payslips" 
      });
    }

    // Check if payslips already generated
    const runSnapshotsQuery = await supabaseAny
      .from("payroll_run_snapshots")
      .select("id")
      .eq("payroll_period_id", payroll_period_id);
    
    const runSnapshots = runSnapshotsQuery.data;
    const snapshotError = runSnapshotsQuery.error;
    
    if (snapshotError) {
      return res.status(500).json({ error: "Failed to fetch snapshots" });
    }

    const snapshotIds = runSnapshots?.map(s => s.id) || [];
    
    if (snapshotIds.length > 0) {
      const { data: existingPayslips, error: checkError } = await supabaseAny
        .from("payslips")
        .select("id")
        .in("payroll_run_snapshot_id", snapshotIds);

      if (checkError) {
        return res.status(500).json({ error: "Failed to check existing payslips" });
      }

      if (existingPayslips && existingPayslips.length > 0) {
        return res.status(400).json({ 
          error: "Payslips already generated for this period" 
        });
      }
    } else {
      return res.status(404).json({ 
        error: "No payroll runs found for this period" 
      });
    }

    // Get all payroll run snapshots with employee details
    const { data: snapshotsData, error: snapshotsError } = await supabaseAny
      .from("payroll_run_snapshots")
      .select(`
        id,
        employee_id,
        gross_salary,
        deductions_total,
        net_pay,
        employee:employees!payroll_run_snapshots_employee_id_fkey(
          id,
          employee_id_number,
          designation,
          department,
          profile:profiles!employees_user_id_fkey(
            id,
            full_name,
            email
          ),
          payroll_profile:employee_payroll_profiles!employee_payroll_profiles_employee_id_fkey(
            bank_account_details
          )
        )
      `)
      .eq("payroll_period_id", payroll_period_id)
      .limit(1); // ONLY ONE EMPLOYEE FOR TESTING

    if (snapshotsError || !snapshotsData || snapshotsData.length === 0) {
      return res.status(404).json({ 
        error: "No payroll runs found for this period" 
      });
    }
    
    const snapshots = snapshotsData as any[];

    // Generate payslips for each snapshot (only 1 due to limit)
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      filePath: ""
    };

    for (const snapshot of snapshots) {
      try {
        // Validate employee data
        if (!snapshot.employee || Array.isArray(snapshot.employee)) {
          results.failed++;
          results.errors.push(`Employee data missing for snapshot ${snapshot.id}`);
          continue;
        }

        const employeeData = snapshot.employee;
        const profile = Array.isArray(employeeData.profile) ? employeeData.profile[0] : employeeData.profile;
        const payrollProfile = Array.isArray(employeeData.payroll_profile) 
          ? employeeData.payroll_profile[0] 
          : employeeData.payroll_profile;

        if (!profile) {
          results.failed++;
          results.errors.push(`Profile missing for employee ${employeeData.id}`);
          continue;
        }

        // Extract bank details
        let bankName = "";
        let accountLastFour = "";
        
        if (payrollProfile?.bank_account_details) {
          const bankDetails = payrollProfile.bank_account_details as any;
          bankName = bankDetails.bank_name || "";
          const accountNumber = bankDetails.account_number || "";
          accountLastFour = accountNumber.slice(-4);
        }

        // Generate HTML payslip content
        const payslipHTML = generatePayslipHTML({
          employeeName: profile.full_name || "N/A",
          employeeIdNumber: employeeData.employee_id_number || "N/A",
          designation: employeeData.designation || "N/A",
          department: employeeData.department || "N/A",
          payPeriod: period.period_name,
          year: period.year,
          month: period.month,
          grossSalary: snapshot.gross_salary,
          deductionsTotal: snapshot.deductions_total,
          netPay: snapshot.net_pay,
          bankName,
          accountLastFour
        });

        // Launch puppeteer and generate PDF
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(payslipHTML, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          }
        });
        
        await browser.close();

        // Upload PDF to Supabase Storage
        const fileName = `${snapshot.employee_id}.pdf`;
        const filePath = `BD/${snapshot.employee_id}/${period.year}-${String(period.month).padStart(2, "0")}.pdf`;

        const { data: uploadData, error: uploadError } = await supabaseAny.storage
          .from("payslips")
          .upload(filePath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: false
          });

        if (uploadError) {
          results.failed++;
          results.errors.push(`Upload failed for ${profile.full_name}: ${uploadError.message}`);
          continue;
        }

        // Get storage URL
        const { data: urlData } = supabaseAny.storage
          .from("payslips")
          .getPublicUrl(filePath);

        // Create payslip record
        const { error: recordError } = await supabaseAny.from("payslips").insert({
          payroll_run_snapshot_id: snapshot.id,
          employee_id: snapshot.employee_id,
          payslip_pdf_url: urlData.publicUrl,
          delivery_status: "pending"
        } as any);

        if (recordError) {
          results.failed++;
          results.errors.push(`Record creation failed for ${profile.full_name}: ${recordError.message}`);
          continue;
        }

        results.success++;
        results.filePath = `payslips/${filePath}`;
      } catch (error) {
        results.failed++;
        results.errors.push(`Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Create audit log
    await supabaseAny.from("audit_logs").insert({
      table_name: "payslips",
      record_id: payroll_period_id,
      action: "generate_payslips",
      actor_id: user.id,
      changes: {
        period: period.period_name,
        total_generated: results.success,
        failed: results.failed
      }
    });

    return res.status(200).json({
      success: true,
      message: `Generated ${results.success} payslip(s)${results.failed > 0 ? ` (${results.failed} failed)` : ""}`,
      file_path: results.filePath,
      results
    });

  } catch (error) {
    console.error("Payslip generation error:", error);
    return res.status(500).json({ 
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// Helper function to generate HTML payslip (unchanged)
function generatePayslipHTML(data: {
  employeeName: string;
  employeeIdNumber: string;
  designation: string;
  department: string;
  payPeriod: string;
  year: number;
  month: number;
  grossSalary: number;
  deductionsTotal: number;
  netPay: number;
  bankName: string;
  accountLastFour: string;
}): string {
  const paymentDate = new Date();
  const generatedDate = paymentDate.toLocaleString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const formatBDT = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #333; }
    .payslip { max-width: 800px; margin: 0 auto; border: 2px solid #2563eb; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; }
    .header h2 { font-size: 18px; font-weight: 400; opacity: 0.95; }
    .employee-info { padding: 30px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 16px; color: #1e293b; font-weight: 500; }
    .salary-details { padding: 30px; }
    .section-title { font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
    .line-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .line-item:last-child { border-bottom: none; }
    .line-label { font-size: 14px; color: #475569; }
    .line-amount { font-size: 14px; font-weight: 600; color: #1e293b; font-family: 'Courier New', monospace; }
    .subtotal { margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0; }
    .subtotal .line-label { font-weight: 600; }
    .net-pay { margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .net-pay .line-label { font-size: 18px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 1px; }
    .net-pay .line-amount { font-size: 24px; font-weight: 700; color: white; }
    .payment-info { padding: 25px 30px; background: #f8fafc; border-top: 2px solid #e2e8f0; }
    .footer { padding: 20px 30px; background: #1e293b; color: #94a3b8; text-align: center; font-size: 12px; line-height: 1.6; }
    .footer strong { color: #e2e8f0; }
    @media print { body { padding: 0; } .payslip { border: none; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="payslip">
    <div class="header">
      <h1>MIGRATESAFELY LIMITED</h1>
      <h2>Monthly Payslip</h2>
    </div>
    <div class="employee-info">
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Employee Name</span><span class="info-value">${data.employeeName}</span></div>
        <div class="info-item"><span class="info-label">Employee ID</span><span class="info-value">${data.employeeIdNumber}</span></div>
        <div class="info-item"><span class="info-label">Designation</span><span class="info-value">${data.designation}</span></div>
        <div class="info-item"><span class="info-label">Department</span><span class="info-value">${data.department}</span></div>
        <div class="info-item"><span class="info-label">Pay Period</span><span class="info-value">${data.payPeriod}</span></div>
        <div class="info-item"><span class="info-label">Payment Date</span><span class="info-value">${paymentDate.toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</span></div>
      </div>
    </div>
    <div class="salary-details">
      <div class="section-title">Earnings</div>
      <div class="line-item"><span class="line-label">Basic Salary</span><span class="line-amount">${formatBDT(data.grossSalary)}</span></div>
      <div class="line-item subtotal"><span class="line-label">Gross Salary</span><span class="line-amount">${formatBDT(data.grossSalary)}</span></div>
      <div class="section-title" style="margin-top: 30px;">Deductions</div>
      <div class="line-item"><span class="line-label">Income Tax</span><span class="line-amount">৳0.00</span></div>
      <div class="line-item"><span class="line-label">EPF (Employee Share)</span><span class="line-amount">৳0.00</span></div>
      <div class="line-item"><span class="label">Other Deductions</span><span class="line-amount">৳0.00</span></div>
      <div class="line-item subtotal"><span class="line-label">Total Deductions</span><span class="line-amount">${formatBDT(data.deductionsTotal)}</span></div>
      <div class="net-pay"><span class="line-label">Net Pay</span><span class="line-amount">${formatBDT(data.netPay)}</span></div>
    </div>
    <div class="payment-info">
      <div class="info-item"><span class="info-label">Payment Method</span><span class="info-value">Bank Transfer</span></div>
      ${data.bankName ? `<div class="info-item" style="margin-top: 15px;"><span class="info-label">Bank Details</span><span class="info-value">${data.bankName}${data.accountLastFour ? ` • Account: ****${data.accountLastFour}` : ""}</span></div>` : ""}
    </div>
    <div class="footer"><strong>This is a system-generated document. No signature is required.</strong><br>Generated on: ${generatedDate}</div>
  </div>
</body>
</html>
  `.trim();
}

export default withAuth(handler);