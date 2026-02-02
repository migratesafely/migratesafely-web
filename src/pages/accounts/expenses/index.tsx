import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Plus, FileText, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/bdtFormatter";

// Manually define interface to avoid complex type instantiation errors
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
  business_purpose?: string; // Optional in type, though required in DB now
  chairman_approval_required?: boolean;
  rejection_reason?: string;
  currency?: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [userAuthorized, setUserAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
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
        setError("Access denied. Only authorized employees can access expense management.");
        setLoading(false);
        return;
      }

      const authorizedDepts = ["accounts", "hr"];
      const authorizedRoles = ["department_head", "general_manager", "managing_director", "chairman"];
      
      const isAuthorized = 
        authorizedDepts.includes(employee.department) || 
        authorizedRoles.includes(employee.role_category);

      if (!isAuthorized) {
        setError("You are not authorized to access expense management.");
        setLoading(false);
        return;
      }

      setUserAuthorized(true);
      await loadExpenses(user.id);

    } catch (err) {
      console.error("Authorization error:", err);
      setError("Failed to verify authorization");
      setLoading(false);
    }
  };

  const loadExpenses = async (userId: string) => {
    try {
      // Cast to any to avoid "excessively deep" type error with complex schema
      const { data, error: fetchError } = await (supabase
        .from("expense_requests") as any)
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Safe cast to our manual interface
      setExpenses((data as any) || []);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError("Failed to load expense requests");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-gray-500",
      submitted: "bg-blue-500",
      dept_head_approved: "bg-indigo-500",
      gm_approved: "bg-purple-500",
      md_approved: "bg-pink-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      paid: "bg-emerald-600",
      archived: "bg-gray-400"
    };

    const statusLabels: Record<string, string> = {
      draft: "Draft",
      submitted: "Pending Approval",
      dept_head_approved: "Dept Head Approved",
      gm_approved: "GM Approved",
      md_approved: "MD Approved",
      approved: "Approved",
      rejected: "Rejected",
      paid: "Paid",
      archived: "Archived"
    };

    return (
      <Badge className={`${statusColors[status] || "bg-gray-500"} text-white`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!userAuthorized) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <div className="container max-w-6xl mx-auto px-4 py-8">
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
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Expense Management</h1>
              <p className="text-muted-foreground">Submit and track expense requests</p>
            </div>
            <Link href="/accounts/expenses/submit">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Submit New Expense
              </Button>
            </Link>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Expense Requests List */}
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No expense requests yet</p>
                  <Link href="/accounts/expenses/submit">
                    <Button>Submit Your First Expense</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {expense.description}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {expense.expense_category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </CardDescription>
                      </div>
                      {getStatusBadge(expense.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="font-semibold flex items-center">
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
                        <p className="text-sm text-muted-foreground mb-1">Department</p>
                        <p className="font-semibold">
                          {expense.department?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                        <p className="font-semibold">
                          {new Date(expense.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {expense.business_purpose && (
                      <div className="mt-4 p-3 bg-secondary/50 rounded">
                        <p className="text-sm text-muted-foreground mb-1">Business Purpose:</p>
                        <p className="text-sm">{expense.business_purpose}</p>
                      </div>
                    )}

                    {expense.receipt_urls && expense.receipt_urls.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Receipts: {expense.receipt_urls.length} file(s) uploaded
                        </p>
                      </div>
                    )}

                    {expense.chairman_approval_required && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Requires Chairman approval (amount exceeds ৳50,000)
                        </AlertDescription>
                      </Alert>
                    )}

                    {expense.rejection_reason && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <span className="font-semibold">Rejection Reason:</span> {expense.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}