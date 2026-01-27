import Head from "next/head";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <>
      <Head>
        <title>Terms of Service - MigrateSafely.com</title>
        <meta name="description" content="MigrateSafely.com Terms of Service: Platform rules, user responsibilities, service limitations, and legal agreements for using our migration connection platform." />
        <meta name="keywords" content="migrate safely, migratesafely.com, safe migration platform, Bangladesh migration support, verified visa agents, trusted migration agents, connect with verified agents, approved visa consultant, work visa support Bangladesh, student visa support Bangladesh, visa scam prevention, report scam agent, scam blacklist database, migration fraud prevention, embassy contact directory, immigration resources Bangladesh, licensed migration agent signup, manpower license verification, free member prize draw, membership benefit rewards program" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Terms of Service - MigrateSafely.com | Platform Rules" />
        <meta property="og:description" content="MigrateSafely.com Terms of Service: Platform rules, user responsibilities, service limitations, and legal agreements for using our migration connection platform." />
        <meta property="og:url" content="https://migratesafely.com/terms" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service - MigrateSafely.com | Platform Rules" />
        <meta name="twitter:description" content="MigrateSafely.com Terms of Service: Platform rules, user responsibilities, service limitations, and legal agreements for using our migration connection platform." />
        <meta name="twitter:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://migratesafely.com/terms" />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
              Last Updated: January 21, 2026
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
              Please read these terms carefully before using our platform.
            </p>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> MigrateSafely.com is a connection platform only. We do not process visas, provide immigration advice, or guarantee visa approval. All services are provided by independent verified agents.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

            {/* 1. Acceptance */}
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  By accessing or using MigrateSafely.com (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Platform.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  These Terms constitute a legally binding agreement between you and MigrateSafely.com ("we," "our," or "us").
                </p>
              </CardContent>
            </Card>

            {/* 2. Platform Description */}
            <Card>
              <CardHeader>
                <CardTitle>2. Platform Description and Scope</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2.1 What We Do</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    MigrateSafely.com is a connection platform that:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Facilitates connections between members and verified migration agents through a request-based system</li>
                    <li>Provides a verified scam report database for community protection</li>
                    <li>Offers members-only prize draws for active paid members</li>
                    <li>Maintains an embassy directory with official contact information</li>
                    <li>Provides internal messaging and support systems</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2.2 What We Do NOT Do</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We explicitly do <strong>not</strong>:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Process visa applications or immigration paperwork</li>
                    <li>Provide immigration advice, legal counsel, or consulting services</li>
                    <li>Guarantee visa approval or immigration outcomes</li>
                    <li>Act as agents, brokers, or intermediaries in visa processes</li>
                    <li>Control or direct the services provided by independent agents</li>
                    <li>Publicly list or advertise agents (request-based connections only)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2.3 Independent Agents</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    All migration agents connected through our platform are independent professionals. We verify their credentials but do not control, supervise, or direct their services. Any agreements, payments, or services between you and an agent are strictly between you and that agent.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. User Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>3. User Accounts and Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3.1 Eligibility</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    You must be at least 18 years old to use our Platform. By creating an account, you represent that you meet this requirement.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3.2 Account Registration</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    You agree to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Not share your account with others</li>
                    <li>Notify us immediately of unauthorized access</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3.3 Account Termination</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We reserve the right to suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or misuse the Platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 4. Membership */}
            <Card>
              <CardHeader>
                <CardTitle>4. Membership and Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.1 Membership Validity</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Paid membership is valid for 365 days from the date of payment confirmation. After expiration, you must renew to continue accessing paid features.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.2 Payment Processing</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Membership payments are processed by third-party payment processors. By making a payment, you agree to their terms. We do not store full payment card details.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.3 Refund Policy</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    All membership fees are non-refundable. If you believe you were incorrectly charged, contact <a href="mailto:support@migratesafely.com" className="text-blue-600 hover:underline">support@migratesafely.com</a> within 7 days.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.4 Agent Payments</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Important:</strong> All payments to agents for their services are made directly between you and the agent. MigrateSafely.com does not process, facilitate, or take any commission from these payments. We are not responsible for payment disputes between members and agents.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Agent Connection Process */}
            <Card>
              <CardHeader>
                <CardTitle>5. Agent Connection Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.1 Request Submission</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Members may submit agent requests specifying their destination country and migration needs. We review each request manually but do not guarantee agent assignment or response times.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.2 Agent Assignment</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We assign verified agents based on expertise, availability, and suitability. Assignment does not guarantee the agent will accept your case or that you will engage their services.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.3 Your Responsibility</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    You are solely responsible for:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Evaluating the agent's suitability for your needs</li>
                    <li>Reviewing and negotiating contracts and fees</li>
                    <li>Verifying agent credentials and licenses</li>
                    <li>Making informed decisions about engaging their services</li>
                    <li>Any agreements or payments made with the agent</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">5.4 No Guarantee of Outcome</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We do not guarantee:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Visa approval or immigration success</li>
                    <li>Agent performance or service quality</li>
                    <li>Specific timelines or results</li>
                    <li>That assigned agents will accept your case</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 6. Prize Draws */}
            <Card>
              <CardHeader>
                <CardTitle>6. Prize Draws</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">6.1 Nature of Prize Draws</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Prize draws are completely free membership benefits for active paid members. No tickets can be purchased, no additional payment is required beyond membership fees, and no payment increases chances of winning. This is a membership benefit program, not a lottery, gambling service, or game of chance offered to the public. Only active registered members with valid membership are eligible.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">6.2 Eligibility</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    All active paid members with membership valid within 365 days of payment are automatically entered into prize draws. No additional payment or entry is required beyond maintaining active membership.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">6.2 Selection Process</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Winners are selected randomly from eligible members. The selection process is conducted by our admin team and results are final.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">6.3 Winner Notification</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Winners are notified via email and internal messaging. Winners must respond within 14 days to claim their prize.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">6.4 Prize Forfeiture</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    If a winner does not respond within 14 days of notification, the prize is forfeited and a new winner may be selected. We reserve the right to redraw or cancel prizes in cases of fraud or rule violations.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">6.5 Prize Terms</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Prizes are non-transferable and may not be exchanged for cash (unless the prize is cash). Additional terms may apply to specific prize draws.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 7. Scam Reports */}
            <Card>
              <CardHeader>
                <CardTitle>7. Scam Reports and Community Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">7.1 Report Submission</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Members may submit scam reports with supporting evidence. All reports are manually reviewed by our admin team before publication.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">7.2 Accuracy and Honesty</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    You agree to provide truthful, accurate information in scam reports. False or malicious reports may result in account termination and legal action.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">7.3 Report Verification</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We verify reports to the best of our ability but cannot guarantee 100% accuracy. We are not liable for consequences arising from published reports made in good faith.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">7.4 Information Use</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use scam report information at your own discretion. We are not responsible for your decisions based on this information.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 8. User Conduct */}
            <Card>
              <CardHeader>
                <CardTitle>8. Prohibited Conduct</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Violate any laws or regulations</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Submit false or malicious scam reports</li>
                  <li>Harass, abuse, or threaten other users or staff</li>
                  <li>Attempt to gain unauthorized access to the Platform</li>
                  <li>Use automated systems (bots, scrapers) without permission</li>
                  <li>Upload malicious code or viruses</li>
                  <li>Engage in fraudulent activity or prize manipulation</li>
                  <li>Publicly list or advertise as an agent without authorization</li>
                  <li>Reverse engineer or copy Platform features</li>
                </ul>
              </CardContent>
            </Card>

            {/* 9. Disclaimer of Warranties */}
            <Card>
              <CardHeader>
                <CardTitle>9. Disclaimer of Warranties</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We do not warrant that:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>The Platform will be uninterrupted, secure, or error-free</li>
                  <li>Agent connections will result in successful immigration outcomes</li>
                  <li>Scam report information is complete or accurate</li>
                  <li>Any particular agent will be available or accept your case</li>
                  <li>Prize draws will occur on specific schedules or for specific amounts</li>
                </ul>
              </CardContent>
            </Card>

            {/* 10. Limitation of Liability */}
            <Card>
              <CardHeader>
                <CardTitle>10. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, MIGRATESAFELY.COM SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Actions or omissions of independent agents</li>
                  <li>Immigration outcomes, visa denials, or application delays</li>
                  <li>Disputes between members and agents</li>
                  <li>Reliance on scam report information</li>
                  <li>Prize draw outcomes or forfeiture</li>
                  <li>Unauthorized access to your account</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  Our total liability shall not exceed the amount you paid for membership in the 12 months preceding the claim.
                </p>
              </CardContent>
            </Card>

            {/* 11. Indemnification */}
            <Card>
              <CardHeader>
                <CardTitle>11. Indemnification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  You agree to indemnify and hold harmless MigrateSafely.com, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Your use of the Platform</li>
                  <li>Your violation of these Terms</li>
                  <li>Your interactions with agents</li>
                  <li>Your scam reports or other submissions</li>
                  <li>Your violation of any third-party rights</li>
                </ul>
              </CardContent>
            </Card>

            {/* 12. Modifications */}
            <Card>
              <CardHeader>
                <CardTitle>12. Modifications to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes via email or Platform notice. Continued use of the Platform after changes take effect constitutes acceptance of the modified Terms.
                </p>
              </CardContent>
            </Card>

            {/* 13. Governing Law */}
            <Card>
              <CardHeader>
                <CardTitle>13. Governing Law and Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  These Terms are governed by the laws of [Your Jurisdiction]. Any disputes shall be resolved through binding arbitration or in courts of competent jurisdiction in [Your Jurisdiction].
                </p>
              </CardContent>
            </Card>

            {/* 14. Contact */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle>14. Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  For questions about these Terms of Service, contact us at:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  <strong>Email:</strong> <a href="mailto:support@migratesafely.com" className="text-blue-600 hover:underline">support@migratesafely.com</a>
                </p>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">MigrateSafely.com</h3>
                <p className="text-sm">
                  Connecting people to verified migration professionals through a secure, request-based process.
                </p>
              </div>

              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/" className="hover:text-white">Home</Link></li>
                  <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
              <p>&copy; {new Date().getFullYear()} MigrateSafely.com. All rights reserved.</p>
              <p className="mt-2 text-gray-500">
                Not a visa agency. We connect members to verified professionals only.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}