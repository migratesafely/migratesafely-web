import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  Archive,
  ArchiveRestore,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobListing {
  id: string;
  title: string;
  title_bn?: string;
  department: string;
  department_bn?: string;
  location_type: "remote" | "on-site" | "hybrid";
  location_country: string;
  location_city?: string;
  employment_type: "full-time" | "part-time" | "contract" | "internship";
  status: "draft" | "open" | "closed";
  is_published: boolean;
  reporting_to?: string;
  summary?: string;
  summary_bn?: string;
  responsibilities?: string;
  responsibilities_bn?: string;
  requirements?: string;
  requirements_bn?: string;
  preferred_experience?: string;
  language_requirements?: string;
  salary_range?: string;
  benefits?: string;
  benefits_bn?: string;
  application_email?: string;
  opens_at?: string;
  closes_at?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminJobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Form state
  const [formData, setFormData] = useState<Partial<JobListing>>({
    title: "",
    title_bn: "",
    department: "",
    department_bn: "",
    location_type: "on-site",
    location_country: "",
    location_city: "",
    employment_type: "full-time",
    status: "draft",
    is_published: false,
    reporting_to: "",
    summary: "",
    summary_bn: "",
    responsibilities: "",
    responsibilities_bn: "",
    requirements: "",
    requirements_bn: "",
    preferred_experience: "",
    language_requirements: "",
    salary_range: "",
    benefits: "",
    benefits_bn: "",
    application_email: "careers@migratesafely.com",
  });

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/admin/login?redirect=/admin/jobs");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      if (!profile || !["manager_admin", "chairman"].includes(profile.role)) {
        router.push("/admin");
        return;
      }

      await loadJobs();
    } catch (err) {
      console.error("Error checking access:", err);
      router.push("/admin");
    }
  }

  async function loadJobs() {
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error("No session");
      }

      const response = await fetch("/api/admin/jobs/list", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load jobs");
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError("Failed to load job listings");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingJob(null);
    setFormData({
      title: "",
      title_bn: "",
      department: "",
      department_bn: "",
      location_type: "on-site",
      location_country: "",
      location_city: "",
      employment_type: "full-time",
      status: "draft",
      is_published: false,
      reporting_to: "",
      summary: "",
      summary_bn: "",
      responsibilities: "",
      responsibilities_bn: "",
      requirements: "",
      requirements_bn: "",
      preferred_experience: "",
      language_requirements: "",
      salary_range: "",
      benefits: "",
      benefits_bn: "",
      application_email: "careers@migratesafely.com",
    });
    setShowDialog(true);
    setError("");
    setSuccess("");
  }

  function openEditDialog(job: JobListing) {
    if (job.archived_at) {
      setError("Cannot edit archived jobs. Restore the job first to make changes.");
      return;
    }
    setEditingJob(job);
    setFormData(job);
    setShowDialog(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error("No session");
      }

      // Validate required fields
      if (!formData.title || !formData.location_country || !formData.department) {
        setError("Please fill in all required fields: Title, Country, and Department");
        setSubmitting(false);
        return;
      }

      const url = editingJob ? "/api/admin/jobs/update" : "/api/admin/jobs/create";
      const method = editingJob ? "PUT" : "POST";
      const body = editingJob ? { ...formData, id: editingJob.id } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save job");
      }

      setSuccess(editingJob ? "Job updated successfully" : "Job created successfully");
      setShowDialog(false);
      await loadJobs();
    } catch (err: any) {
      console.error("Error saving job:", err);
      setError(err.message || "Failed to save job");
    } finally {
      setSubmitting(false);
    }
  }

  async function closePosition(job: JobListing) {
    if (job.status === "closed") {
      setError("This position is already closed");
      return;
    }

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error("No session");
      }

      const response = await fetch("/api/admin/jobs/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: job.id, status: "closed" }),
      });

      if (!response.ok) {
        throw new Error("Failed to close position");
      }

      setSuccess("Position closed successfully. Job now shows as 'Position Filled' to public.");
      await loadJobs();
    } catch (err: any) {
      console.error("Error closing position:", err);
      setError(err.message || "Failed to close position");
    }
  }

  async function reopenPosition(job: JobListing) {
    if (job.status === "open") {
      setError("This position is already open");
      return;
    }

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error("No session");
      }

      const response = await fetch("/api/admin/jobs/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: job.id, status: "open" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reopen position");
      }

      setSuccess("Position reopened successfully");
      await loadJobs();
    } catch (err: any) {
      console.error("Error reopening position:", err);
      setError(err.message || "Failed to reopen position");
    }
  }

  async function togglePublished(job: JobListing) {
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error("No session");
      }

      const response = await fetch("/api/admin/jobs/toggle-published", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: job.id, is_published: !job.is_published }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      const action = !job.is_published ? "published" : "unpublished";
      setSuccess(
        `Job ${action} successfully. ${
          !job.is_published
            ? "Now visible on public careers page."
            : "Removed from public view, stored for internal records."
        }`
      );
      await loadJobs();
    } catch (err: any) {
      console.error("Error toggling visibility:", err);
      setError(err.message || "Failed to update visibility");
    }
  }

  async function archiveJob(job: JobListing) {
    if (job.archived_at) {
      setError("This job is already archived");
      return;
    }

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error("No session");
      }

      const response = await fetch("/api/admin/jobs/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ job_id: job.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive job");
      }

      setSuccess(
        "Job archived successfully. Removed from public view and moved to archived section."
      );
      await loadJobs();
      setActiveTab("archived");
    } catch (err: any) {
      console.error("Error archiving job:", err);
      setError(err.message || "Failed to archive job");
    }
  }

  async function restoreJob(job: JobListing) {
    if (!job.archived_at) {
      setError("This job is not archived");
      return;
    }

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error("No session");
      }

      const response = await fetch("/api/admin/jobs/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ job_id: job.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore job");
      }

      setSuccess("Job restored successfully. You can now edit and publish it again.");
      await loadJobs();
      setActiveTab("active");
    } catch (err: any) {
      console.error("Error restoring job:", err);
      setError(err.message || "Failed to restore job");
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      open: "default",
      closed: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
  }

  const activeJobs = jobs.filter((job) => !job.archived_at);
  const archivedJobs = jobs.filter((job) => job.archived_at);

  if (loading) {
    return (
      <>
        <SEO title="Job Management - Admin" />
        <MainHeader />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO title="Job Management - Admin" />
      <MainHeader />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Job Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage job listings for the careers page
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="mb-6">
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-600 dark:text-blue-400">
              <strong>Audit-Friendly System:</strong> Jobs are never hard-deleted. You can close
              positions, unpublish them, or archive them for internal records. All history is
              preserved.
            </AlertDescription>
          </Alert>

          {/* Tabs for Active/Archived Jobs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "archived")}>
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Active Jobs ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived Jobs ({archivedJobs.length})
              </TabsTrigger>
            </TabsList>

            {/* Active Jobs Table */}
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Active Job Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeJobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No active job listings. Create your first job posting.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeJobs.map((job) => (
                            <TableRow key={job.id}>
                              <TableCell className="font-medium">{job.title}</TableCell>
                              <TableCell>{job.department}</TableCell>
                              <TableCell>
                                {job.location_city ? `${job.location_city}, ` : ""}
                                {job.location_country}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({job.location_type})
                                </span>
                              </TableCell>
                              <TableCell className="capitalize">{job.employment_type}</TableCell>
                              <TableCell>{getStatusBadge(job.status)}</TableCell>
                              <TableCell>
                                {job.is_published ? (
                                  <Badge className="bg-green-500">Public</Badge>
                                ) : (
                                  <Badge variant="secondary">Hidden</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(job.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(job)}
                                    title="Edit job"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {job.status === "open" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => closePosition(job)}
                                      title="Close position (mark as filled)"
                                      className="text-orange-600 hover:text-orange-700"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  ) : job.status === "closed" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => reopenPosition(job)}
                                      title="Reopen position"
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  ) : null}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => togglePublished(job)}
                                    title={
                                      job.is_published
                                        ? "Unpublish (remove from public view)"
                                        : "Publish (make visible to public)"
                                    }
                                  >
                                    {job.is_published ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => archiveJob(job)}
                                    title="Archive job (move to archived section)"
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <Archive className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Archived Jobs Table */}
            <TabsContent value="archived">
              <Card>
                <CardHeader>
                  <CardTitle>Archived Job Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {archivedJobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No archived job listings. Archive jobs to preserve them for internal records.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Archived Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {archivedJobs.map((job) => (
                            <TableRow key={job.id} className="opacity-75">
                              <TableCell className="font-medium">{job.title}</TableCell>
                              <TableCell>{job.department}</TableCell>
                              <TableCell>
                                {job.location_city ? `${job.location_city}, ` : ""}
                                {job.location_country}
                              </TableCell>
                              <TableCell className="capitalize">{job.employment_type}</TableCell>
                              <TableCell>{getStatusBadge(job.status)}</TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {job.archived_at
                                  ? new Date(job.archived_at).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => restoreJob(job)}
                                  title="Restore job to active listings"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <ArchiveRestore className="h-3 w-3 mr-1" />
                                  Restore
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Create/Edit Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingJob ? "Edit Job Listing" : "Create Job Listing"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the job details. Required fields are marked with *.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Job Title (English) *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="title_bn">Job Title (Bengali)</Label>
                      <Input
                        id="title_bn"
                        value={formData.title_bn || ""}
                        onChange={(e) => setFormData({ ...formData, title_bn: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department (English) *</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="department_bn">Department (Bengali)</Label>
                      <Input
                        id="department_bn"
                        value={formData.department_bn || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, department_bn: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="location_country">Country *</Label>
                      <Input
                        id="location_country"
                        value={formData.location_country}
                        onChange={(e) =>
                          setFormData({ ...formData, location_country: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location_city">City</Label>
                      <Input
                        id="location_city"
                        value={formData.location_city || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, location_city: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="location_type">Location Type</Label>
                      <Select
                        value={formData.location_type}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, location_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="on-site">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select
                        value={formData.employment_type}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, employment_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <input
                        type="checkbox"
                        id="is_published"
                        checked={formData.is_published}
                        onChange={(e) =>
                          setFormData({ ...formData, is_published: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="is_published">Published</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reporting_to">Reporting To</Label>
                      <Input
                        id="reporting_to"
                        value={formData.reporting_to || ""}
                        onChange={(e) => setFormData({ ...formData, reporting_to: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary_range">Salary Range</Label>
                      <Input
                        id="salary_range"
                        value={formData.salary_range || ""}
                        onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                        placeholder="e.g., $50,000 - $70,000"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Job Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="summary">Job Summary (English)</Label>
                      <Textarea
                        id="summary"
                        value={formData.summary || ""}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="summary_bn">Job Summary (Bengali)</Label>
                      <Textarea
                        id="summary_bn"
                        value={formData.summary_bn || ""}
                        onChange={(e) => setFormData({ ...formData, summary_bn: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="responsibilities">Key Responsibilities (English)</Label>
                      <Textarea
                        id="responsibilities"
                        value={formData.responsibilities || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, responsibilities: e.target.value })
                        }
                        rows={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="responsibilities_bn">Key Responsibilities (Bengali)</Label>
                      <Textarea
                        id="responsibilities_bn"
                        value={formData.responsibilities_bn || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, responsibilities_bn: e.target.value })
                        }
                        rows={6}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="requirements">Required Qualifications (English)</Label>
                      <Textarea
                        id="requirements"
                        value={formData.requirements || ""}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        rows={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="requirements_bn">Required Qualifications (Bengali)</Label>
                      <Textarea
                        id="requirements_bn"
                        value={formData.requirements_bn || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, requirements_bn: e.target.value })
                        }
                        rows={6}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="preferred_experience">Preferred Experience</Label>
                    <Textarea
                      id="preferred_experience"
                      value={formData.preferred_experience || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, preferred_experience: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="language_requirements">Language Requirements</Label>
                    <Input
                      id="language_requirements"
                      value={formData.language_requirements || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, language_requirements: e.target.value })
                      }
                      placeholder="e.g., English (Fluent), Bengali (Native)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="benefits">Benefits (English)</Label>
                      <Textarea
                        id="benefits"
                        value={formData.benefits || ""}
                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="benefits_bn">Benefits (Bengali)</Label>
                      <Textarea
                        id="benefits_bn"
                        value={formData.benefits_bn || ""}
                        onChange={(e) => setFormData({ ...formData, benefits_bn: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Application Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Application Settings</h3>

                  <div>
                    <Label htmlFor="application_email">Application Email</Label>
                    <Input
                      id="application_email"
                      type="email"
                      value={formData.application_email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, application_email: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="opens_at">Opens At (Optional)</Label>
                      <Input
                        id="opens_at"
                        type="datetime-local"
                        value={
                          formData.opens_at
                            ? new Date(formData.opens_at).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            opens_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="closes_at">Closes At (Optional)</Label>
                      <Input
                        id="closes_at"
                        type="datetime-local"
                        value={
                          formData.closes_at
                            ? new Date(formData.closes_at).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            closes_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingJob ? (
                      "Update Job"
                    ) : (
                      "Create Job"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  );
}