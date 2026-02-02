import { useState } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Upload, X, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/bdtFormatter";

interface ExpenseCategory {
  value: string;
  label: string;
  group: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  // Office & Property
  { value: "office_rent", label: "Office Rent", group: "Office & Property" },
  { value: "office_rent_advance", label: "Office Rent Advance/Deposit", group: "Office & Property" },
  { value: "office_purchase", label: "Office Purchase (Property)", group: "Office & Property" },
  { value: "office_legal_fees", label: "Legal/Registration Fees", group: "Office & Property" },
  { value: "office_renovation", label: "Office Renovation & Fit-out", group: "Office & Property" },
  { value: "office_utilities", label: "Office Utilities", group: "Office & Property" },
  
  // Transport & Vehicles
  { value: "vehicle_purchase", label: "Vehicle Purchase", group: "Transport & Vehicles" },
  { value: "vehicle_lease", label: "Vehicle Lease/Hire Purchase", group: "Transport & Vehicles" },
  { value: "vehicle_rental", label: "Vehicle Rental", group: "Transport & Vehicles" },
  { value: "fuel_maintenance", label: "Fuel & Maintenance", group: "Transport & Vehicles" },
  { value: "vehicle_insurance", label: "Vehicle Insurance & Taxes", group: "Transport & Vehicles" },
  { value: "driver_salaries", label: "Driver Salaries & Allowances", group: "Transport & Vehicles" },
  
  // Travel & Accommodation
  { value: "flights", label: "Flights (Domestic/International)", group: "Travel & Accommodation" },
  { value: "hotels", label: "Hotels/Serviced Apartments", group: "Travel & Accommodation" },
  { value: "local_transport", label: "Local Transport", group: "Travel & Accommodation" },
  { value: "visa_costs", label: "Visa & Travel Admin", group: "Travel & Accommodation" },
  { value: "travel_allowance", label: "Business Travel Allowances", group: "Travel & Accommodation" },
  
  // Operational Expenses
  { value: "utilities", label: "Utilities (Electric/Water/Gas)", group: "Operational Expenses" },
  { value: "internet_phone", label: "Internet & Phone", group: "Operational Expenses" },
  { value: "office_supplies", label: "Office Supplies & Stationery", group: "Operational Expenses" },
  { value: "petty_cash", label: "Petty Cash Expenses", group: "Operational Expenses" },
  { value: "vendor_invoices", label: "Vendor Invoices & Services", group: "Operational Expenses" },
  { value: "emergency_expenses", label: "Emergency/Unforeseen Expenses", group: "Operational Expenses" }
];

export default function SubmitExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingReceipts, setUploadingReceipts] = useState(false);

  const [formData, setFormData] = useState({
    expense_category: "",
    description: "",
    amount: "",
    expense_date: "",
    business_purpose: "",
    cost_centre: ""
  });

  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [receiptUrls, setReceiptUrls] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleAmountChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    handleInputChange("amount", numericValue);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError("Only JPEG, PNG, and PDF files are allowed");
      return;
    }

    // Validate file sizes (max 5MB per file)
    const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      setError("Each file must be less than 5MB");
      return;
    }

    setReceiptFiles(prev => [...prev, ...files]);
    setError("");
  };

  const removeFile = (index: number) => {
    setReceiptFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadReceipts = async (): Promise<string[]> => {
    if (receiptFiles.length === 0) return [];

    setUploadingReceipts(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of receiptFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `expense-receipts/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const { data: urlData } = supabase.storage
          .from("expense-receipts")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    } catch (err: any) {
      console.error("Receipt upload error:", err);
      throw new Error(err.message || "Failed to upload receipts");
    } finally {
      setUploadingReceipts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (!formData.expense_category) {
      setError("Please select an expense category");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please provide a description");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!formData.expense_date) {
      setError("Please select an expense date");
      return;
    }

    if (!formData.business_purpose.trim()) {
      setError("Please provide a business purpose");
      return;
    }

    // Validate receipt for non-petty-cash expenses
    if (formData.expense_category !== "petty_cash" && receiptFiles.length === 0) {
      setError("Receipt upload is required for all expenses except petty cash");
      return;
    }

    setLoading(true);

    try {
      // Upload receipts first
      let uploadedUrls: string[] = [];
      if (receiptFiles.length > 0) {
        uploadedUrls = await uploadReceipts();
      }

      // Submit expense request
      const response = await fetch("/api/accounts/expense/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_category: formData.expense_category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date,
          business_purpose: formData.business_purpose,
          cost_centre: formData.cost_centre || undefined,
          receipt_urls: uploadedUrls
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit expense");
      }

      setSuccess(`Expense request submitted successfully! Request ID: ${data.expense_request.id.substring(0, 8)}`);
      
      // Reset form
      setFormData({
        expense_category: "",
        description: "",
        amount: "",
        expense_date: "",
        business_purpose: "",
        cost_centre: ""
      });
      setReceiptFiles([]);
      setReceiptUrls([]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/accounts/expenses");
      }, 2000);

    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit expense request");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.value === formData.expense_category);
  const isPettyCash = formData.expense_category === "petty_cash";

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          <Link href="/accounts/expenses">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Submit Expense Request</CardTitle>
              <CardDescription>
                Submit a new expense request for approval. All fields are required unless marked optional.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Success Alert */}
                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Expense Category */}
                <div className="space-y-2">
                  <Label htmlFor="expense_category">
                    Expense Category <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.expense_category} 
                    onValueChange={(value) => handleInputChange("expense_category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {["Office & Property", "Transport & Vehicles", "Travel & Accommodation", "Operational Expenses"].map(group => (
                        <div key={group}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {group}
                          </div>
                          {EXPENSE_CATEGORIES.filter(c => c.group === group).map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <p className="text-sm text-muted-foreground">
                      Group: {selectedCategory.group}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the expense"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/200 characters
                  </p>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">৳</span>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                  </div>
                  {formData.amount && parseFloat(formData.amount) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Amount: {formatBDT(parseFloat(formData.amount))}
                    </p>
                  )}
                  {formData.amount && parseFloat(formData.amount) > 50000 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This expense requires Chairman approval (amount exceeds ৳50,000)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Expense Date */}
                <div className="space-y-2">
                  <Label htmlFor="expense_date">
                    Expense Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => handleInputChange("expense_date", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Date when the expense was incurred
                  </p>
                </div>

                {/* Business Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="business_purpose">
                    Business Purpose <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="business_purpose"
                    placeholder="Explain the business purpose and justification for this expense"
                    value={formData.business_purpose}
                    onChange={(e) => handleInputChange("business_purpose", e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.business_purpose.length}/500 characters
                  </p>
                </div>

                {/* Cost Centre (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="cost_centre">
                    Cost Centre <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="cost_centre"
                    placeholder="e.g., Marketing, Operations, IT"
                    value={formData.cost_centre}
                    onChange={(e) => handleInputChange("cost_centre", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use your department as the cost centre
                  </p>
                </div>

                {/* Receipt Upload */}
                <div className="space-y-2">
                  <Label htmlFor="receipt">
                    Receipt Upload {!isPettyCash && <span className="text-red-500">*</span>}
                    {isPettyCash && <span className="text-muted-foreground">(Optional for petty cash)</span>}
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      id="receipt"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="receipt" className="cursor-pointer">
                      <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload receipts</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPEG, PNG, or PDF • Max 5MB per file
                      </p>
                    </label>
                  </div>

                  {receiptFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium">Selected Files ({receiptFiles.length}):</p>
                      {receiptFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading || uploadingReceipts}
                    className="flex-1"
                  >
                    {uploadingReceipts ? "Uploading Receipts..." : loading ? "Submitting..." : "Submit Expense Request"}
                  </Button>
                  <Link href="/accounts/expenses">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>

                {/* Info */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your expense request will be submitted for approval. You will be notified of the approval status.
                    {formData.amount && parseFloat(formData.amount) > 50000 && (
                      <span className="block mt-2 font-semibold">
                        This expense requires approval from: Department Head → GM → MD → Chairman
                      </span>
                    )}
                    {formData.amount && parseFloat(formData.amount) <= 50000 && parseFloat(formData.amount) > 0 && (
                      <span className="block mt-2 font-semibold">
                        This expense requires approval from: Department Head → GM → MD
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}