import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/bdtFormatter";

interface PayslipData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeIdNumber: string;
  designation: string;
  department: string;
  payPeriod: string;
  year: number;
  month: number;
  grossSalary: number;
  deductionsTotal: number;
  netPay: number;
  bankName?: string;
  accountLastFour?: string;
}

/**
 * Generate HTML payslip content
 */
export function generatePayslipHTML(data: PayslipData): string {
  const paymentDate = new Date();
  const generatedDate = paymentDate.toLocaleString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      background: white;
      color: #333;
    }
    
    .payslip {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #2563eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    
    .header h2 {
      font-size: 18px;
      font-weight: 400;
      opacity: 0.95;
    }
    
    .employee-info {
      padding: 30px;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 500;
    }
    
    .salary-details {
      padding: 30px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .line-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .line-item:last-child {
      border-bottom: none;
    }
    
    .line-label {
      font-size: 14px;
      color: #475569;
    }
    
    .line-amount {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      font-family: 'Courier New', monospace;
    }
    
    .subtotal {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #e2e8f0;
    }
    
    .subtotal .line-label {
      font-weight: 600;
    }
    
    .net-pay {
      margin-top: 25px;
      padding: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .net-pay .line-label {
      font-size: 18px;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .net-pay .line-amount {
      font-size: 24px;
      font-weight: 700;
      color: white;
    }
    
    .payment-info {
      padding: 25px 30px;
      background: #f8fafc;
      border-top: 2px solid #e2e8f0;
    }
    
    .payment-info .info-label {
      margin-bottom: 8px;
    }
    
    .footer {
      padding: 20px 30px;
      background: #1e293b;
      color: #94a3b8;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
    }
    
    .footer strong {
      color: #e2e8f0;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .payslip {
        border: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="payslip">
    <!-- Header -->
    <div class="header">
      <h1>MIGRATESAFELY LIMITED</h1>
      <h2>Monthly Payslip</h2>
    </div>
    
    <!-- Employee Information -->
    <div class="employee-info">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Employee Name</span>
          <span class="info-value">${data.employeeName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Employee ID</span>
          <span class="info-value">${data.employeeIdNumber}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Designation</span>
          <span class="info-value">${data.designation}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Department</span>
          <span class="info-value">${data.department}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Pay Period</span>
          <span class="info-value">${data.payPeriod}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Payment Date</span>
          <span class="info-value">${paymentDate.toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>
    </div>
    
    <!-- Salary Details -->
    <div class="salary-details">
      <!-- Earnings -->
      <div class="section-title">Earnings</div>
      <div class="line-item">
        <span class="line-label">Basic Salary</span>
        <span class="line-amount">${formatBDT(data.grossSalary)}</span>
      </div>
      <div class="line-item subtotal">
        <span class="line-label">Gross Salary</span>
        <span class="line-amount">${formatBDT(data.grossSalary)}</span>
      </div>
      
      <!-- Deductions -->
      <div class="section-title" style="margin-top: 30px;">Deductions</div>
      <div class="line-item">
        <span class="line-label">Income Tax</span>
        <span class="line-amount">৳0.00</span>
      </div>
      <div class="line-item">
        <span class="line-label">EPF (Employee Share)</span>
        <span class="line-amount">৳0.00</span>
      </div>
      <div class="line-item">
        <span class="line-label">Other Deductions</span>
        <span class="line-amount">৳0.00</span>
      </div>
      <div class="line-item subtotal">
        <span class="line-label">Total Deductions</span>
        <span class="line-amount">${formatBDT(data.deductionsTotal)}</span>
      </div>
      
      <!-- Net Pay -->
      <div class="net-pay">
        <span class="line-label">Net Pay</span>
        <span class="line-amount">${formatBDT(data.netPay)}</span>
      </div>
    </div>
    
    <!-- Payment Information -->
    <div class="payment-info">
      <div class="info-item">
        <span class="info-label">Payment Method</span>
        <span class="info-value">Bank Transfer</span>
      </div>
      ${data.bankName ? `
      <div class="info-item" style="margin-top: 15px;">
        <span class="info-label">Bank Details</span>
        <span class="info-value">${data.bankName}${data.accountLastFour ? ` • Account: ****${data.accountLastFour}` : ""}</span>
      </div>
      ` : ""}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <strong>This is a system-generated document. No signature is required.</strong><br>
      Generated on: ${generatedDate}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Convert HTML to PDF using browser's print functionality
 * This is a placeholder - in production, use a proper PDF generation service
 */
export async function htmlToPDF(html: string): Promise<Blob> {
  // Create a temporary iframe to render HTML
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Could not access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 100));

  // Note: This is a simplified approach
  // In production, use jsPDF or a server-side PDF generation service
  const htmlContent = iframeDoc.documentElement.outerHTML;
  const blob = new Blob([htmlContent], { type: "text/html" });

  document.body.removeChild(iframe);
  return blob;
}

/**
 * Upload payslip PDF to Supabase Storage
 */
export async function uploadPayslipPDF(
  year: number,
  month: number,
  employeeId: string,
  pdfBlob: Blob
): Promise<string> {
  const fileName = `${employeeId}.pdf`;
  const filePath = `${year}/${String(month).padStart(2, "0")}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("payslips")
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: false // Don't allow overwriting existing payslips
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Failed to upload payslip: ${error.message}`);
  }

  // Get public URL (even though bucket is private, we store the path)
  const { data: urlData } = supabase.storage
    .from("payslips")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Create payslip record in database
 */
export async function createPayslipRecord(
  payrollRunSnapshotId: string,
  employeeId: string,
  pdfUrl: string
): Promise<void> {
  const { error } = await supabase.from("payslips").insert({
    payroll_run_snapshot_id: payrollRunSnapshotId,
    employee_id: employeeId,
    payslip_pdf_url: pdfUrl,
    delivery_status: "pending"
  } as any);

  if (error) {
    console.error("Database error:", error);
    throw new Error(`Failed to create payslip record: ${error.message}`);
  }
}