import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainHeader } from "@/components/MainHeader";
import { BangladeshTimeDisplay } from "@/components/BangladeshTimeDisplay";
import { AlertCircle, Scale, FileText, Shield } from "lucide-react";

export default function LegalAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!profile || !["legal_admin", "super_admin", "master_admin"].includes(profile.role)) {
          router.push("/admin");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("Error checking access:", err);
        router.push("/admin");
      }
    };

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Legal Admin - Foundation"
        description="Legal department foundation - compliance and regulatory coordination"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <MainHeader />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Legal Admin Department
              </h1>
              <BangladeshTimeDisplay />
            </div>
          </div>

          {/* Foundation Notice */}
          <Card className="p-6 mb-8 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Foundation Only - No Active Workflows
                </h2>
                <p className="text-blue-700 dark:text-blue-300 mb-3">
                  This department structure is created as a compliance and growth prerequisite. 
                  Legal admin workflows, permissions, and operational features will be implemented 
                  as business needs develop.
                </p>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  Status: Structure Only
                </Badge>
              </div>
            </div>
          </Card>

          {/* Placeholder Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Compliance Management
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Compliance tracking and regulatory coordination features will be added here.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Regulatory Coordination
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Regulatory filing and coordination tools will be implemented as needed.
              </p>
            </Card>
          </div>

          {/* Access Information */}
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Department Access
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• <strong>Legal Admin:</strong> Full access to legal department features</p>
              <p>• <strong>Super Admin:</strong> Administrative oversight and configuration</p>
              <p>• <strong>Master Admin:</strong> System-wide governance access</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}