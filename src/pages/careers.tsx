import React, { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { jobListingsService } from "@/services/jobListingsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Briefcase, MapPin, Clock, Building2, User, Mail, Globe } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type JobListing = Database["public"]["Tables"]["job_listings"]["Row"];

const TRANSLATIONS = {
  en: {
    pageTitle: "Human Resources | Migrate Safely",
    metaDescription: "Join MigrateSafely's mission to make migration safer and fairer. View current job openings and career opportunities.",
    title: "Human Resources",
    subtitle: "Join our mission to make migration safer and fairer.",
    intro: "MigrateSafely is expanding operations and welcomes applications from qualified and ethical professionals. When positions are available, they will be advertised here.",
    noJobs: "We are not currently hiring. Future opportunities will be advertised here as our services expand to new countries.",
    footerNotice: "Hiring phases are announced based on country licensing and operational readiness.",
    viewDetails: "View Details",
    location: "Location",
    department: "Department",
    employmentType: "Employment Type",
    status: "Status",
    loading: "Loading job listings...",
    error: "Unable to load job listings. Please try again later.",
    remote: "Remote",
    onSite: "On-site",
    hybrid: "Hybrid",
    fullTime: "Full-time",
    partTime: "Part-time",
    contract: "Contract",
    internship: "Internship",
    open: "Open",
    closed: "Closed",
    positionFilled: "Position Filled",
    // Job details modal
    jobDetails: "Job Details",
    reportingTo: "Reporting To",
    jobSummary: "Job Summary",
    keyResponsibilities: "Key Responsibilities",
    requiredQualifications: "Required Qualifications",
    preferredExperience: "Preferred Experience",
    languageRequirements: "Language Requirements",
    salaryRange: "Salary Range",
    benefits: "Benefits",
    applicationInstructions: "How to Apply",
    applicationMethod: "To apply, please email your CV and a short cover letter to:",
    emailAddress: "careers@migratesafely.com",
    subjectLineFormat: "Subject line format:",
    subjectLineExample: "Application – [Job Title] – [Country]",
    disclaimer: "MigrateSafely is an equal opportunity organisation. All applications are handled confidentially.",
    close: "Close",
    opensAt: "Opens",
    closesAt: "Closes",
  },
  bn: {
    pageTitle: "মানব সম্পদ | নিরাপদে মাইগ্রেট করুন",
    metaDescription: "মাইগ্রেশনকে আরও নিরাপদ এবং ন্যায্য করার জন্য MigrateSafely এর মিশনে যোগ দিন। বর্তমান চাকরির সুযোগ দেখুন।",
    title: "মানব সম্পদ",
    subtitle: "মাইগ্রেশনকে আরও নিরাপদ এবং ন্যায্য করার আমাদের মিশনে যোগ দিন।",
    intro: "MigrateSafely কার্যক্রম সম্প্রসারণ করছে এবং যোগ্য এবং নৈতিক পেশাদারদের কাছ থেকে আবেদন স্বাগত জানায়। পদ উপলব্ধ হলে, সেগুলি এখানে বিজ্ঞাপন দেওয়া হবে।",
    noJobs: "আমরা বর্তমানে নিয়োগ করছি না। আমাদের সেবা নতুন দেশে সম্প্রসারিত হওয়ার সাথে সাথে ভবিষ্যতের সুযোগগুলি এখানে বিজ্ঞাপন দেওয়া হবে।",
    footerNotice: "দেশের লাইসেন্সিং এবং অপারেশনাল প্রস্তুতির উপর ভিত্তি করে নিয়োগের পর্যায় ঘোষণা করা হয়।",
    viewDetails: "বিস্তারিত দেখুন",
    location: "অবস্থান",
    department: "বিভাগ",
    employmentType: "কর্মসংস্থানের ধরন",
    status: "স্থিতি",
    loading: "চাকরির তালিকা লোড হচ্ছে...",
    error: "চাকরির তালিকা লোড করতে অক্ষম। দয়া করে পরে আবার চেষ্টা করুন।",
    remote: "দূরবর্তী",
    onSite: "অন-সাইট",
    hybrid: "হাইব্রিড",
    fullTime: "পূর্ণ-সময়",
    partTime: "খণ্ডকালীন",
    contract: "চুক্তি",
    internship: "ইন্টার্নশিপ",
    open: "খোলা",
    closed: "বন্ধ",
    positionFilled: "পদ পূরণ হয়েছে",
    // Job details modal
    jobDetails: "চাকরির বিবরণ",
    reportingTo: "রিপোর্টিং",
    jobSummary: "চাকরির সারাংশ",
    keyResponsibilities: "মূল দায়িত্ব",
    requiredQualifications: "প্রয়োজনীয় যোগ্যতা",
    preferredExperience: "পছন্দের অভিজ্ঞতা",
    languageRequirements: "ভাষা প্রয়োজনীয়তা",
    salaryRange: "বেতন পরিসীমা",
    benefits: "সুবিধা",
    applicationInstructions: "কিভাবে আবেদন করবেন",
    applicationMethod: "আবেদন করতে, আপনার সিভি এবং একটি সংক্ষিপ্ত কভার লেটার ইমেইল করুন:",
    emailAddress: "careers@migratesafely.com",
    subjectLineFormat: "সাবজেক্ট লাইন ফরম্যাট:",
    subjectLineExample: "Application – [Job Title] – [Country]",
    disclaimer: "MigrateSafely একটি সমান সুযোগ সংস্থা। সমস্ত আবেদন গোপনীয়ভাবে পরিচালনা করা হয়।",
    close: "বন্ধ করুন",
    opensAt: "খোলে",
    closesAt: "বন্ধ হয়",
  },
};

export default function CareersPage() {
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      setError(false);
      const data = await jobListingsService.getOpenJobListings();
      // Filter out archived jobs (extra safety layer)
      const activeJobs = data.filter(job => !job.archived_at);
      setJobs(activeJobs);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function getLocationText(job: JobListing): string {
    const parts = [job.location_country];
    if (job.location_city) {
      parts.push(job.location_city);
    }
    return parts.join(", ");
  }

  function getLocationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      remote: t.remote,
      "on-site": t.onSite,
      hybrid: t.hybrid,
    };
    return labels[type] || type;
  }

  function getEmploymentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      "full-time": t.fullTime,
      "part-time": t.partTime,
      contract: t.contract,
      internship: t.internship,
    };
    return labels[type] || type;
  }

  function getJobTitle(job: JobListing): string {
    return language === "bn" && job.title_bn ? job.title_bn : job.title;
  }

  function getJobDepartment(job: JobListing): string {
    return language === "bn" && job.department_bn ? job.department_bn : job.department;
  }

  function getJobSummary(job: JobListing): string | null {
    return language === "bn" && job.summary_bn ? job.summary_bn : job.summary;
  }

  function getJobResponsibilities(job: JobListing): string | null {
    return language === "bn" && job.responsibilities_bn ? job.responsibilities_bn : job.responsibilities;
  }

  function getJobRequirements(job: JobListing): string | null {
    return language === "bn" && job.requirements_bn ? job.requirements_bn : job.requirements;
  }

  function getJobBenefits(job: JobListing): string | null {
    return language === "bn" && job.benefits_bn ? job.benefits_bn : job.benefits;
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <>
      <SEO title={t.pageTitle} description={t.metaDescription} />
      <AppHeader />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t.title}
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
              {t.subtitle}
            </p>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {t.intro}
              </p>
            </div>
          </div>

          {/* Job Listings Section */}
          <div className="mb-12">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t.loading}</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{t.error}</p>
                <Button onClick={loadJobs} variant="outline" className="mt-4">
                  Try Again
                </Button>
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <Card className="max-w-3xl mx-auto border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                <CardContent className="py-16 px-6 text-center">
                  <div className="mb-6">
                    <Briefcase className="h-20 w-20 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {language === "en" ? "No Open Positions" : "কোন খোলা পদ নেই"}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                    {t.noJobs}
                  </p>
                </CardContent>
              </Card>
            )}

            {!loading && !error && jobs.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-2xl">{getJobTitle(job)}</CardTitle>
                        <Badge variant={job.status === "open" ? "default" : "secondary"}>
                          {job.status === "open" ? t.open : t.positionFilled}
                        </Badge>
                      </div>
                      <CardDescription className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4" />
                          <span>{getJobDepartment(job)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {getLocationText(job)} • {getLocationTypeLabel(job.location_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{getEmploymentTypeLabel(job.employment_type)}</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => setSelectedJob(job)}
                      >
                        {t.viewDetails}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t.footerNotice}
            </p>
          </div>
        </div>
      </main>

      {/* Job Details Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <DialogTitle className="text-3xl">{getJobTitle(selectedJob)}</DialogTitle>
                  <Badge variant={selectedJob.status === "open" ? "default" : "secondary"}>
                    {selectedJob.status === "open" ? t.open : t.positionFilled}
                  </Badge>
                </div>
                <DialogDescription className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <span className="font-semibold">{t.department}:</span>
                    <span>{getJobDepartment(selectedJob)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span className="font-semibold">{t.location}:</span>
                    <span>
                      {getLocationText(selectedJob)} • {getLocationTypeLabel(selectedJob.location_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">{t.employmentType}:</span>
                    <span>{getEmploymentTypeLabel(selectedJob.employment_type)}</span>
                  </div>
                  {selectedJob.reporting_to && (
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span className="font-semibold">{t.reportingTo}:</span>
                      <span>{selectedJob.reporting_to}</span>
                    </div>
                  )}
                  {selectedJob.salary_range && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.salaryRange}:</span>
                      <span>{selectedJob.salary_range}</span>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Job Summary */}
                {getJobSummary(selectedJob) && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                      {t.jobSummary}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {getJobSummary(selectedJob)}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Key Responsibilities */}
                {getJobResponsibilities(selectedJob) && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                      {t.keyResponsibilities}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {getJobResponsibilities(selectedJob)}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Required Qualifications */}
                {getJobRequirements(selectedJob) && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                      {t.requiredQualifications}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {getJobRequirements(selectedJob)}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Preferred Experience */}
                {selectedJob.preferred_experience && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                      {t.preferredExperience}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {selectedJob.preferred_experience}
                    </p>
                  </div>
                )}

                {/* Language Requirements */}
                {selectedJob.language_requirements && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {t.languageRequirements}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {selectedJob.language_requirements}
                      </p>
                    </div>
                  </>
                )}

                {/* Benefits */}
                {getJobBenefits(selectedJob) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                        {t.benefits}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {getJobBenefits(selectedJob)}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Application Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {t.applicationInstructions}
                  </h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>{t.applicationMethod}</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 text-lg">
                      {t.emailAddress}
                    </p>
                    <div>
                      <p className="font-semibold mb-1">{t.subjectLineFormat}</p>
                      <p className="text-sm italic">{t.subjectLineExample}</p>
                    </div>
                    {selectedJob.opens_at && (
                      <p className="text-sm">
                        <span className="font-semibold">{t.opensAt}:</span> {formatDate(selectedJob.opens_at)}
                      </p>
                    )}
                    {selectedJob.closes_at && (
                      <p className="text-sm">
                        <span className="font-semibold">{t.closesAt}:</span> {formatDate(selectedJob.closes_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {t.disclaimer}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedJob(null)} variant="outline">
                  {t.close}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}