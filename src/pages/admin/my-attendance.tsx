import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, AlertTriangle, XCircle, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getEmployeeAttendanceHistory, type AttendanceHistory } from "@/services/attendanceService";

export default function MyAttendancePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AttendanceHistory[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  useEffect(() => {
    if (employeeId) {
      loadHistory();
    }
  }, [employeeId]);

  const fetchEmployeeProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get employee record linked to this user
      const { data: employee, error } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error || !employee) {
        console.error("Employee record not found:", error);
        // Fallback: try using profile ID if linked differently in legacy
        // But for A5.7B we rely on user_id link
        return;
      }

      setEmployeeId(employee.id);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const loadHistory = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const result = await getEmployeeAttendanceHistory(employeeId);
      if (result.success && result.data) {
        setHistory(result.data);
      } else {
        toast({
          title: "Error loading history",
          description: result.error || "Failed to load attendance records",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "N/A";
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_time": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "late": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "absent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "excused": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStats = () => {
    const total = history.length;
    if (total === 0) return { onTime: 0, late: 0, absent: 0 };
    
    const onTime = history.filter(h => h.status === 'on_time').length;
    const late = history.filter(h => h.status === 'late').length;
    const absent = history.filter(h => h.status === 'absent').length;

    return {
      onTimeP: Math.round((onTime / total) * 100),
      lateP: Math.round((late / total) * 100),
      absentP: Math.round((absent / total) * 100)
    };
  };

  const stats = getStats();

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                My Attendance History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Your personal attendance record (Read-only)
              </p>
            </div>
            <Button variant="outline" onClick={loadHistory} disabled={loading}>
              <History className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">On Time Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.onTimeP}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-100" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Late Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.lateP}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-100" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Absence Rate</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absentP}%</p>
                </div>
                <XCircle className="h-8 w-8 text-red-100" />
              </CardContent>
            </Card>
          </div>

          {/* History List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 30 days of attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No attendance records found</div>
              ) : (
                <div className="space-y-4">
                  {history.map((record, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                          <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium">{new Date(record.attendance_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          <div className="flex gap-2 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Exp: {formatTime(record.expected_login_time)}
                            </span>
                            {record.actual_login_time && (
                              <span className="flex items-center gap-1">
                                • Act: {formatTime(record.actual_login_time)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getStatusColor(record.status)}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {record.lateness_minutes && record.lateness_minutes > 0 && (
                          <p className="text-xs text-red-500 mt-1">+{record.lateness_minutes} min</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}