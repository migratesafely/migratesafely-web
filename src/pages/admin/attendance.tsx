import { useState, useEffect } from "react";
import { MainHeader } from "@/components/MainHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, XCircle, UserX, Download, Filter, BarChart3, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAttendanceSummary,
  getLateEmployees,
  getAbsentEmployees,
  getDepartments,
  logAttendanceExport,
  type AttendanceSummary,
  type LateEmployee,
  type AbsentEmployee
} from "@/services/attendanceService";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];
const PAGE_SIZE = 20;

type StatusFilter = "present" | "late" | "absent" | "awol";

export default function AttendanceDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [lateEmployees, setLateEmployees] = useState<LateEmployee[]>([]);
  const [absentEmployees, setAbsentEmployees] = useState<AbsentEmployee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Pagination states
  const [latePage, setLatePage] = useState(1);
  const [absentPage, setAbsentPage] = useState(1);

  // Chart data states
  const [chartData, setChartData] = useState<{
    dailySummary: Array<{ name: string; value: number; fill: string }>;
    lateArrivals: Array<{ department: string; count: number }>;
    absenceTrend: Array<{ status: string; count: number }>;
  }>({
    dailySummary: [],
    lateArrivals: [],
    absenceTrend: []
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate, selectedDepartment]);

  const loadDepartments = async () => {
    const result = await getDepartments();
    if (result.success && result.data) {
      setDepartments(result.data);
    }
  };

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const dept = selectedDepartment === "all" ? undefined : selectedDepartment;

      const [summaryResult, lateResult, absentResult] = await Promise.all([
        getAttendanceSummary(selectedDate, dept),
        getLateEmployees(selectedDate, dept),
        getAbsentEmployees(selectedDate, dept)
      ]);

      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
        
        // Prepare chart data
        prepareChartData(summaryResult.data, lateResult.data || [], absentResult.data || []);
      } else {
        toast({
          title: "Error loading summary",
          description: summaryResult.error || "Failed to load attendance summary",
          variant: "destructive"
        });
      }

      if (lateResult.success && lateResult.data) {
        setLateEmployees(lateResult.data);
      }

      if (absentResult.success && absentResult.data) {
        setAbsentEmployees(absentResult.data);
      }

      // Reset pagination when data changes
      setLatePage(1);
      setAbsentPage(1);
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (
    summary: AttendanceSummary,
    late: LateEmployee[],
    absent: AbsentEmployee[]
  ) => {
    // Daily summary pie chart
    const dailySummary = [
      { name: "On Time", value: summary.on_time, fill: "#10b981" },
      { name: "Late", value: summary.late, fill: "#f59e0b" },
      { name: "Absent", value: summary.absent, fill: "#ef4444" },
      { name: "Excused", value: summary.excused, fill: "#6366f1" }
    ].filter(item => item.value > 0);

    // Late arrivals by department
    const deptLateMap = new Map<string, number>();
    late.forEach(emp => {
      const dept = emp.department.toUpperCase();
      deptLateMap.set(dept, (deptLateMap.get(dept) || 0) + 1);
    });
    const lateArrivals = Array.from(deptLateMap.entries()).map(([department, count]) => ({
      department,
      count
    }));

    // Absence trend
    const absenceTrend = [
      { status: "Late", count: summary.late },
      { status: "Absent", count: summary.absent },
      { status: "Excused", count: summary.excused }
    ].filter(item => item.count > 0);

    setChartData({
      dailySummary,
      lateArrivals,
      absenceTrend
    });
  };

  const toggleStatusFilter = (status: StatusFilter) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    // Reset pagination when filter changes
    setLatePage(1);
    setAbsentPage(1);
  };

  const getFilteredLateEmployees = () => {
    if (selectedStatuses.length === 0) return lateEmployees;
    return selectedStatuses.includes("late") ? lateEmployees : [];
  };

  const getFilteredAbsentEmployees = () => {
    if (selectedStatuses.length === 0) return absentEmployees;
    return selectedStatuses.includes("absent") || selectedStatuses.includes("awol") 
      ? absentEmployees 
      : [];
  };

  const getPaginatedData = <T,>(data: T[], page: number): T[] => {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength: number): number => {
    return Math.ceil(dataLength / PAGE_SIZE);
  };

  const filteredLateEmployees = getFilteredLateEmployees();
  const filteredAbsentEmployees = getFilteredAbsentEmployees();

  const paginatedLateEmployees = getPaginatedData(filteredLateEmployees, latePage);
  const paginatedAbsentEmployees = getPaginatedData(filteredAbsentEmployees, absentPage);

  const lateTotalPages = getTotalPages(filteredLateEmployees.length);
  const absentTotalPages = getTotalPages(filteredAbsentEmployees.length);

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const allData = [
        ...filteredLateEmployees.map(emp => ({
          employee_id: emp.employee_id,
          name: emp.employee_name,
          role: emp.role,
          department: emp.department.toUpperCase(),
          date: selectedDate,
          status: "Late",
          late_minutes: emp.lateness_minutes,
          expected_time: emp.expected_login_time,
          actual_time: emp.actual_login_time,
          exception_applied: "No"
        })),
        ...filteredAbsentEmployees.map(emp => ({
          employee_id: emp.employee_id,
          name: emp.employee_name,
          role: emp.role,
          department: emp.department.toUpperCase(),
          date: selectedDate,
          status: "Absent",
          late_minutes: 0,
          expected_time: emp.expected_login_time,
          actual_time: "N/A",
          exception_applied: "No"
        }))
      ];

      if (allData.length === 0) {
        toast({
          title: "No Data",
          description: "No attendance records to export",
          variant: "destructive"
        });
        return;
      }

      // Log export using A5.7D-1 audit function
      const auditResult = await logAttendanceExport("csv", {
        startDate: selectedDate,
        endDate: selectedDate,
        department: selectedDepartment !== "all" ? selectedDepartment : undefined,
        recordCount: allData.length
      });

      if (!auditResult.success) {
        console.warn("Audit logging failed:", auditResult.error);
        // Continue with export even if audit fails
      }

      // Create CSV
      const headers = ["Employee ID", "Name", "Role", "Department", "Date", "Status", "Late Minutes", "Expected Time", "Actual Time", "Exception Applied"];
      const csv = [
        headers.join(","),
        ...allData.map(row => [
          row.employee_id,
          `"${row.name}"`,
          `"${row.role}"`,
          row.department,
          row.date,
          row.status,
          row.late_minutes,
          row.expected_time,
          row.actual_time,
          row.exception_applied
        ].join(","))
      ].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${selectedDate}_${selectedDepartment}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${allData.length} records to CSV`
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const allData = [
        ...filteredLateEmployees.map(emp => ({
          "Employee ID": emp.employee_id,
          "Name": emp.employee_name,
          "Role": emp.role,
          "Department": emp.department.toUpperCase(),
          "Date": selectedDate,
          "Status": "Late",
          "Late Minutes": emp.lateness_minutes,
          "Expected Time": emp.expected_login_time,
          "Actual Time": emp.actual_login_time,
          "Exception Applied": "No"
        })),
        ...filteredAbsentEmployees.map(emp => ({
          "Employee ID": emp.employee_id,
          "Name": emp.employee_name,
          "Role": emp.role,
          "Department": emp.department.toUpperCase(),
          "Date": selectedDate,
          "Status": "Absent",
          "Late Minutes": 0,
          "Expected Time": emp.expected_login_time,
          "Actual Time": "N/A",
          "Exception Applied": "No"
        }))
      ];

      if (allData.length === 0) {
        toast({
          title: "No Data",
          description: "No attendance records to export",
          variant: "destructive"
        });
        return;
      }

      // Log export using A5.7D-1 audit function
      const auditResult = await logAttendanceExport("xlsx", {
        startDate: selectedDate,
        endDate: selectedDate,
        department: selectedDepartment !== "all" ? selectedDepartment : undefined,
        recordCount: allData.length
      });

      if (!auditResult.success) {
        console.warn("Audit logging failed:", auditResult.error);
        // Continue with export even if audit fails
      }

      // Create Excel workbook
      const ws = XLSX.utils.json_to_sheet(allData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      // Download
      XLSX.writeFile(wb, `attendance_${selectedDate}_${selectedDepartment}.xlsx`);

      toast({
        title: "Export Successful",
        description: `Exported ${allData.length} records to Excel`
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "N/A";
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const hasExportData = filteredLateEmployees.length > 0 || filteredAbsentEmployees.length > 0;

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange,
    totalRecords 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
    totalRecords: number;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      fallbackTitle="Attendance Dashboard Error"
      fallbackMessage="Attendance data could not be loaded. Please refresh or try again later."
    >
      <MainHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Employee Attendance Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor employee attendance and lateness (Informational only - No penalties applied)
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status Filter</label>
                    <div className="space-y-2 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-present"
                          checked={selectedStatuses.includes("present")}
                          onCheckedChange={() => toggleStatusFilter("present")}
                        />
                        <label htmlFor="filter-present" className="text-sm cursor-pointer">
                          Present
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-late"
                          checked={selectedStatuses.includes("late")}
                          onCheckedChange={() => toggleStatusFilter("late")}
                        />
                        <label htmlFor="filter-late" className="text-sm cursor-pointer">
                          Late
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-absent"
                          checked={selectedStatuses.includes("absent")}
                          onCheckedChange={() => toggleStatusFilter("absent")}
                        />
                        <label htmlFor="filter-absent" className="text-sm cursor-pointer">
                          Absent
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-awol"
                          checked={selectedStatuses.includes("awol")}
                          onCheckedChange={() => toggleStatusFilter("awol")}
                        />
                        <label htmlFor="filter-awol" className="text-sm cursor-pointer">
                          AWOL
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={loadAttendanceData} disabled={loading} className="flex-1">
                      {loading ? "Loading..." : "Apply Filters"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Export Actions */}
          <div className="flex gap-2 mb-6">
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={!hasExportData || exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button 
              onClick={exportToExcel} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={!hasExportData || exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total_employees}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">On Time</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.on_time}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.total_employees > 0
                      ? Math.round((summary.on_time / summary.total_employees) * 100)
                      : 0}
                    % on time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Late</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{summary.late}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {Math.round(summary.average_lateness_minutes)} min late
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Absent</CardTitle>
                  <UserX className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Excused: {summary.excused}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily Attendance Overview
                </CardTitle>
                <CardDescription>Status breakdown for {selectedDate}</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.dailySummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.dailySummary}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.dailySummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No attendance data for selected date
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Late Arrivals by Department */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Late Arrivals by Department
                </CardTitle>
                <CardDescription>Breakdown of lateness across departments</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.lateArrivals.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.lateArrivals}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" name="Late Employees" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No late arrivals for selected date
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Absence Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Attendance Status Distribution</CardTitle>
                <CardDescription>Current status counts for {selectedDate}</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.absenceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.absenceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#6366f1" name="Employee Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No attendance issues for selected date
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Late Employees List */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Late Employees ({filteredLateEmployees.length})
              </CardTitle>
              <CardDescription>
                Employees who logged in after the grace period (Informational only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLateEmployees.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {selectedStatuses.length > 0 && !selectedStatuses.includes("late")
                    ? "Late employees filtered out by status filter"
                    : "No late employees today"}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Employee</th>
                          <th className="text-left py-3 px-4">Role</th>
                          <th className="text-left py-3 px-4">Department</th>
                          <th className="text-left py-3 px-4">Expected</th>
                          <th className="text-left py-3 px-4">Actual</th>
                          <th className="text-left py-3 px-4">Late By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLateEmployees.map((employee) => (
                          <tr key={employee.employee_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">{employee.employee_name}</td>
                            <td className="py-3 px-4">{employee.role}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{employee.department.toUpperCase()}</Badge>
                            </td>
                            <td className="py-3 px-4">{formatTime(employee.expected_login_time)}</td>
                            <td className="py-3 px-4">{formatTime(employee.actual_login_time)}</td>
                            <td className="py-3 px-4">
                              <Badge variant="destructive">{employee.lateness_minutes} min</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    currentPage={latePage}
                    totalPages={lateTotalPages}
                    onPageChange={setLatePage}
                    totalRecords={filteredLateEmployees.length}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Absent Employees List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Absent Employees ({filteredAbsentEmployees.length})
              </CardTitle>
              <CardDescription>
                Employees who did not log in (Informational only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAbsentEmployees.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {selectedStatuses.length > 0 && !selectedStatuses.includes("absent") && !selectedStatuses.includes("awol")
                    ? "Absent employees filtered out by status filter"
                    : "No absent employees today"}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Employee</th>
                          <th className="text-left py-3 px-4">Role</th>
                          <th className="text-left py-3 px-4">Department</th>
                          <th className="text-left py-3 px-4">Expected Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAbsentEmployees.map((employee) => (
                          <tr key={employee.employee_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">{employee.employee_name}</td>
                            <td className="py-3 px-4">{employee.role}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{employee.department.toUpperCase()}</Badge>
                            </td>
                            <td className="py-3 px-4">{formatTime(employee.expected_login_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    currentPage={absentPage}
                    totalPages={absentTotalPages}
                    onPageChange={setAbsentPage}
                    totalRecords={filteredAbsentEmployees.length}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}