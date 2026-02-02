import React, { useState, useEffect } from "react";
import { adminNotificationService, AdminNotification } from "@/services/adminNotificationService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, AlertTriangle, Clock, XCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/router";

export function AdminNotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const data = await adminNotificationService.getUnreadNotifications();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      setLoading(true);
      const success = await adminNotificationService.markAsRead(notificationId);
      
      if (success) {
        await loadNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleNotificationClick(notification: AdminNotification) {
    // Mark as read
    await handleMarkAsRead(notification.id);
    
    // Navigate to appropriate page
    if (notification.notificationType === "tier_bonus_approval") {
      router.push("/admin/tier-bonus-approvals");
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "overdue": return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      case "critical": return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800";
      case "high": return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
      default: return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
    }
  }

  function getPriorityIcon(priority: string) {
    switch (priority) {
      case "overdue": return <XCircle className="h-4 w-4" />;
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  }

  function getPriorityLabel(priority: string) {
    switch (priority) {
      case "overdue": return "OVERDUE (72h+)";
      case "critical": return "CRITICAL";
      case "high": return "HIGH PRIORITY (48h+)";
      default: return "PENDING";
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admin Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} Unread</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No pending notifications</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(notification.priority)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      {getPriorityIcon(notification.priority)}
                      {notification.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {getPriorityLabel(notification.priority)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Member:</span> {notification.memberFullName}</p>
                    {notification.metadata.tier_name && (
                      <p><span className="font-medium">Tier Achieved:</span> {notification.metadata.tier_name} (Level {notification.metadata.tier_level})</p>
                    )}
                    {notification.metadata.bonus_percentage && (
                      <p><span className="font-medium">Bonus:</span> {notification.metadata.bonus_percentage}% ({notification.metadata.currency_code} {notification.metadata.calculated_bonus_amount?.toFixed(2)})</p>
                    )}
                    {notification.metadata.base_referral_bonus && (
                      <p className="text-xs text-muted-foreground">
                        Base: {notification.metadata.currency_code} {notification.metadata.base_referral_bonus?.toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Clock className="h-3 w-3" />
                    <span>Pending for {notification.hoursPending} hours</span>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    disabled={loading}
                  >
                    Review Approval
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}