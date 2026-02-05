import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { AlertCircle, CheckCircle2, DollarSign, Calendar, User, Building, Eye, Download, FileText, CreditCard, Filter, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatBDT } from "@/lib/bdtFormatter";
import { useToast } from "@/hooks/use-toast";

interface ExpenseRequest {
  id: string;
  created_at: string;
  created_by: string;
  expense_category: string;
  description: string;
  amount: number;
  expense_date: string;
  department: string;
  status: string;
  receipt_urls: string[] | null;
  business_purpose: string;
  cost_centre?: string;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  payment_notes?: string;
  chairman_approval_required: boolean;
  dept_head_approved_at?: string;
  gm_approved_at?: string;
  md_approved_at?: string;
  chairman_approved_at?: string;
  created_by_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
  created_by_employee?: {
    department: string;
    role_category: string;
  };
}

export default function PaymentQueuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [userRole, setUserRole] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [hasPaymentAuthority, setHasPaymentAuthority] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("approved");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    checkAuthorizationAndLoad();
  }, [statusFilter, categoryFilter, startDate, endDate]);

  const checkAuthorizationAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is an authorized employee
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, department, role_category")
        .eq("user_id", user.id)
        .single();

      if (employeeError || !employee) {
        setError("Access denied. Only authorized employees can process payments.");
        setLoading(false);
        return;
      }

      const role = employee.role_category;
      const dept = employee.department;

      // Check if user has payment authority
      const isSuperAdmin = await agentPermissionsService.isSuperAdmin(user.id);
      
      const hasAuthority = 
        dept === "accounts" ||
        ["managing_director", "general_manager"].includes(role) ||
        isSuperAdmin;

      if (!hasAuthority) {
        setError("You do not have payment processing authority.");
        setLoading(false);
        return;
      }

      setUserRole(isSuperAdmin ? "super_admin" : role);
      setUserDepartment(dept);
      setHasPaymentAuthority(true);
      await loadPaymentQueue();

    } catch (err) {
      console.error("Authorization error:", err);
      setError("Failed to verify authorization");
      setLoading(false);
    }
  };

  const loadPaymentQueue = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter
      });

      if (categoryFilter !== "all") {
        params.append("expense_category", categoryFilter);
      }
      if (startDate) {
        params.append("start_date", startDate);
      }
      if (endDate) {
        params.append("end_date", endDate);
      }

      const response = await fetch(`/api/admin/expenses/payment-queue?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load payment queue");
      }

      setExpenses(data.expenses || []);
      setUserRole(data.userRole);
      setUserDepartment(data.userDepartment);
      setHasPaymentAuthority(data.hasPaymentAuthority);
    } catch (err: any) {
      console.error("Error loading payment queue:", err);
      setError(err.message || "Failed to load payment queue");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedExpense) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/expenses/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_request_id: selectedExpense.id,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || null,
          payment_notes: paymentNotes.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark expense as paid");
      }

      setSuccess(`Expense marked as paid successfully. Payment reference: ${paymentReference || "N/A"}`);
      setPaymentModalOpen(false);
      setSelectedExpense(null);
      setPaymentReference("");
      setPaymentNotes("");
      setPaymentMethod("bank_transfer");
      
      // Reload payment queue
      await loadPaymentQueue();

    } catch (err: any) {
      console.error("Mark paid error:", err);
      setError(err.message || "Failed to mark expense as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = (expense: ExpenseRequest) => {
    setSelectedExpense(expense);
    setViewModalOpen(true);
  };

  const openPaymentModal = (expense: ExpenseRequest) => {
    setSelectedExpense(expense);
    setPaymentModalOpen(true);
  };

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ["Expense ID", "Category", "Description", "Amount (BDT)", "Requested By", "Department", "Expense Date", "Approval Date", "Status"];
    
    const rows = filteredExpenses.map(exp => [
      exp.id,
      exp.expense_category?.replace(/_/g, " "),
      exp.description,
      exp.amount.toString(),
      exp.created_by_profile?.full_name || "Unknown",
      exp.department?.replace(/_/g, " "),
      exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : "N/A",
      exp.md_approved_at || exp.chairman_approved_at || "N/A",
      exp.status
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-queue-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setStatusFilter("approved");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Search filtering (client-side)
  const filteredExpenses = expenses.filter((expense) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    
    // Search in expense ID
    if (expense.id.toLowerCase().includes(query)) return true;
    
    // Search in description
    if (expense.description?.toLowerCase().includes(query)) return true;
    
    // Search in category
    if (expense.expense_category?.toLowerCase().includes(query)) return true;
    
    // Search in requested by name
    if (expense.created_by_profile?.full_name?.toLowerCase().includes(query)) return true;
    
    // Search in department
    if (expense.department?.toLowerCase().includes(query)) return true;
    
    // Search in created by email
    if (expense.created_by_profile?.email?.toLowerCase().includes(query)) return true;
    
    return false;
  });

  // Pagination calculations (work on filtered expenses)
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, startDate, endDate, searchQuery]);

  const getStatusBadge = (status: string, paymentDate?: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-500 text-white">Paid</Badge>;
    }
    if (status === "approved" && !paymentDate) {
      return <Badge className="bg-blue-500 text-white">Ready for Payment</Badge>;
    }
    return <Badge className="bg-gray-500 text-white">{status}</Badge>;
  };

  const getApprovalDate = (expense: ExpenseRequest) => {
    if (expense.chairman_approved_at) {
      return new Date(expense.chairman_approved_at).toLocaleDateString();
    }
    if (expense.md_approved_at) {
      return new Date(expense.md_approved_at).toLocaleDateString();
    }
    if (expense.gm_approved_at) {
      return new Date(expense.gm_approved_at).toLocaleDateString();
    }
    if (expense.dept_head_approved_at) {
      return new Date(expense.dept_head_approved_at).toLocaleDateString();
    }
    return "N/A";
  };

  if (loading) {
    return (
      <>
        <MainHeader />
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <div className="container max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!hasPaymentAuthority) {
    return (
      <>
        <MainHeader />
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <div className="container max-w-7xl mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Payment Processing</h1>
                <p className="text-muted-foreground">
                  Process approved expense payments
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {statusFilter === "approved" ? "Ready for Payment" : "Paid Expenses"}
                </p>
                <p className="text-3xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Search Input */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by ID, description, name, department, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {searchQuery && (
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredExpenses.length} {filteredExpenses.length === 1 ? "result" : "results"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="status_filter">Payment Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status_filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Ready for Payment</SelectItem>
                        <SelectItem value="paid">Already Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category_filter">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger id="category_filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="office_rent">Office Rent</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="petty_cash">Petty Cash</SelectItem>
                        <SelectItem value="flights">Flights</SelectItem>
                        <SelectItem value="hotels">Hotels</SelectItem>
                        <SelectItem value="vehicle_purchase">Vehicle Purchase</SelectItem>
                        <SelectItem value="office_supplies">Office Supplies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Payment Queue List */}
          <div className="space-y-4">
            {paginatedExpenses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground mb-2">
                    {searchQuery 
                      ? `No expenses found matching "${searchQuery}"`
                      : statusFilter === "approved" 
                        ? "No expenses ready for payment"
                        : "No paid expenses found"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search query or filters"
                      : statusFilter === "approved"
                        ? "All approved expenses have been processed"
                        : "Adjust filters to see paid expenses"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              paginatedExpenses.map((expense) => (
                <Card key={expense.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {expense.description}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {expense.expense_category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </CardDescription>
                        {expense.created_by_profile && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{expense.created_by_profile.full_name}</span>
                            {expense.created_by_employee && (
                              <>
                                <span>•</span>
                                <Building className="h-4 w-4" />
                                <span>{expense.created_by_employee.department?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(expense.status, expense.payment_date)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="font-semibold flex items-center text-lg">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatBDT(expense.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Expense Date</p>
                        <p className="font-semibold flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Approval Date</p>
                        <p className="font-semibold">
                          {getApprovalDate(expense)}
                        </p>
                      </div>
                      {expense.payment_date && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
                          <p className="font-semibold">
                            {new Date(expense.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {expense.chairman_approval_required && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <span className="font-semibold">Chairman Approved</span> (amount exceeds ৳50,000)
                        </AlertDescription>
                      </Alert>
                    )}

                    {expense.payment_reference && (
                      <div className="mb-4 p-3 bg-secondary rounded">
                        <p className="text-sm font-medium">Payment Reference: {expense.payment_reference}</p>
                        {expense.payment_method && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Method: {expense.payment_method.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        )}
                        {expense.payment_notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Notes: {expense.payment_notes}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(expense)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {expense.status === "approved" && !expense.payment_date && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openPaymentModal(expense)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {filteredExpenses.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} expenses
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Complete information for expense request
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-semibold">
                    {selectedExpense.expense_category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{formatBDT(selectedExpense.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expense Date</p>
                  <p className="font-semibold">
                    {selectedExpense.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">
                    {selectedExpense.department?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                {selectedExpense.cost_centre && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cost Centre</p>
                    <p className="font-semibold">{selectedExpense.cost_centre}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="font-semibold">{selectedExpense.description}</p>
              </div>

              {/* Business Purpose */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Business Purpose</p>
                <div className="p-3 bg-secondary rounded">
                  <p className="text-sm">{selectedExpense.business_purpose}</p>
                </div>
              </div>

              {/* Receipts */}
              {selectedExpense.receipt_urls && selectedExpense.receipt_urls.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Receipts ({selectedExpense.receipt_urls.length} file(s))
                  </p>
                  <div className="space-y-2">
                    {selectedExpense.receipt_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Receipt {index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(url, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View/Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Chain */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Approval Chain</p>
                <div className="p-3 bg-secondary rounded space-y-2">
                  {selectedExpense.dept_head_approved_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Department Head</span>
                      <span className="text-green-600">✓ {new Date(selectedExpense.dept_head_approved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedExpense.gm_approved_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span>General Manager</span>
                      <span className="text-green-600">✓ {new Date(selectedExpense.gm_approved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedExpense.md_approved_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Managing Director</span>
                      <span className="text-green-600">✓ {new Date(selectedExpense.md_approved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedExpense.chairman_approved_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Chairman</span>
                      <span className="text-green-600">✓ {new Date(selectedExpense.chairman_approved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {selectedExpense.payment_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Information</p>
                  <div className="p-3 bg-green-50 border border-green-200 rounded space-y-1">
                    <p className="text-sm"><span className="font-semibold">Status:</span> Paid</p>
                    <p className="text-sm"><span className="font-semibold">Date:</span> {new Date(selectedExpense.payment_date).toLocaleDateString()}</p>
                    {selectedExpense.payment_method && (
                      <p className="text-sm"><span className="font-semibold">Method:</span> {selectedExpense.payment_method.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                    )}
                    {selectedExpense.payment_reference && (
                      <p className="text-sm"><span className="font-semibold">Reference:</span> {selectedExpense.payment_reference}</p>
                    )}
                    {selectedExpense.payment_notes && (
                      <p className="text-sm"><span className="font-semibold">Notes:</span> {selectedExpense.payment_notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Expense as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for this expense
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded">
                <p className="font-semibold mb-2">{selectedExpense.description}</p>
                <p className="text-2xl font-bold">{formatBDT(selectedExpense.amount)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Category: {selectedExpense.expense_category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_reference">Payment Reference</Label>
                <Input
                  id="payment_reference"
                  placeholder="e.g., TXN123456, Cheque #7890"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Transaction ID, cheque number, etc.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_notes">Payment Notes</Label>
                <Textarea
                  id="payment_notes"
                  placeholder="Any additional notes about the payment"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {paymentNotes.length}/500 characters
                </p>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  This expense will be marked as paid and recorded in the audit trail.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentModalOpen(false);
                setPaymentReference("");
                setPaymentNotes("");
                setPaymentMethod("bank_transfer");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}