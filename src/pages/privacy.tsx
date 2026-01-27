import Head from "next/head";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - MigrateSafely.com</title>
        <meta name="description" content="MigrateSafely.com Privacy Policy: Learn how we collect, use, protect, and manage your personal information on our platform." />
        <meta name="keywords" content="migrate safely, migratesafely.com, safe migration platform, Bangladesh migration support, verified visa agents, trusted migration agents, connect with verified agents, approved visa consultant, work visa support Bangladesh, student visa support Bangladesh, visa scam prevention, report scam agent, scam blacklist database, migration fraud prevention, embassy contact directory, immigration resources Bangladesh, licensed migration agent signup, manpower license verification, free member prize draw, membership benefit rewards program" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Privacy Policy - MigrateSafely.com | Data Protection" />
        <meta property="og:description" content="MigrateSafely.com Privacy Policy: Learn how we collect, use, protect, and manage your personal information on our platform." />
        <meta property="og:url" content="https://migratesafely.com/privacy" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - MigrateSafely.com | Data Protection" />
        <meta name="twitter:description" content="MigrateSafely.com Privacy Policy: Learn how we collect, use, protect, and manage your personal information on our platform." />
        <meta name="twitter:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://migratesafely.com/privacy" />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
              Last Updated: January 21, 2026
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle>1. Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400">
                  MigrateSafely.com ("we," "our," or "us") operates as a connection platform between members seeking migration assistance and verified migration agents. We are committed to protecting your personal information and your right to privacy.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  This Privacy Policy applies to all information collected through our website, platform, and related services (collectively, the "Services").
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
              <CardHeader>
                <CardTitle>2. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2.1 Information You Provide</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Account Information:</strong> Name, email address, country of residence, password</li>
                    <li><strong>Profile Information:</strong> Additional details you choose to provide</li>
                    <li><strong>Agent Requests:</strong> Destination country, request type, migration needs, personal notes</li>
                    <li><strong>Scam Reports:</strong> Agent details, evidence uploads, incident descriptions</li>
                    <li><strong>Payment Information:</strong> Processed by third-party payment processors (we do not store full payment details)</li>
                    <li><strong>Communications:</strong> Messages sent through our platform, support inquiries</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2.2 Automatically Collected Information</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                    <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                    <li><strong>Cookies:</strong> Essential cookies for platform functionality, analytics cookies (with consent)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card>
              <CardHeader>
                <CardTitle>3. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li><strong>Platform Services:</strong> Facilitate agent connections, process requests, manage your account</li>
                  <li><strong>Communication:</strong> Send notifications about request status, prize draws, important updates</li>
                  <li><strong>Verification:</strong> Review and verify scam reports, validate agent credentials</li>
                  <li><strong>Prize Draws:</strong> Manage eligibility, conduct random selection, notify winners</li>
                  <li><strong>Improvement:</strong> Analyze usage patterns to improve our services</li>
                  <li><strong>Security:</strong> Detect and prevent fraud, protect against abuse</li>
                  <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
                </ul>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card>
              <CardHeader>
                <CardTitle>4. Information Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.1 Verified Agents</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    When we assign an agent to your request, we share relevant information from your agent request (destination country, request type, notes) with the assigned verified agent. We do not share your payment information or unrelated personal data.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.2 Service Providers</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We use third-party service providers for:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Payment processing (Stripe, PayPal, or similar)</li>
                    <li>Email delivery</li>
                    <li>Cloud hosting and storage</li>
                    <li>Analytics (with anonymization)</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    These providers have access only to the information necessary to perform their services and are obligated to protect your data.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.3 Public Information</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    The following information may be made public:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Prize Winners:</strong> First name, country, prize category (with your consent)</li>
                    <li><strong>Verified Scam Reports:</strong> Agent/company details, scam description (your identity remains confidential)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.4 Legal Requirements</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We may disclose your information if required by law, legal process, or to protect rights, safety, or property.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4.5 What We Do NOT Share</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We do <strong>not</strong> sell, rent, or trade your personal information to third parties for marketing purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle>5. Data Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We implement industry-standard security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Encrypted data transmission (SSL/TLS)</li>
                  <li>Secure password hashing</li>
                  <li>Regular security audits</li>
                  <li>Access controls and authentication</li>
                  <li>Secure database hosting</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  While we take reasonable precautions, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle>6. Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li><strong>Active Accounts:</strong> Retained while your account is active</li>
                  <li><strong>Inactive Accounts:</strong> Retained for up to 2 years after last activity, then anonymized or deleted</li>
                  <li><strong>Scam Reports:</strong> Retained indefinitely for community protection (reporter identity confidential)</li>
                  <li><strong>Financial Records:</strong> Retained for 7 years for legal and tax compliance</li>
                  <li><strong>Communications:</strong> Retained for 3 years for support and dispute resolution</li>
                </ul>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle>7. Your Privacy Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal retention requirements)</li>
                  <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                  <li><strong>Withdrawal:</strong> Withdraw consent for optional data processing</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@migratesafely.com" className="text-blue-600 hover:underline">privacy@migratesafely.com</a>
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>8. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">8.1 Essential Cookies</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Required for platform functionality (authentication, session management, security). These cannot be disabled.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">8.2 Analytics Cookies</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Help us understand how users interact with our platform. You can opt out through your browser settings.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">8.3 Managing Cookies</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Most browsers allow you to control cookies through settings. Note that disabling essential cookies may affect platform functionality.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>9. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately at <a href="mailto:privacy@migratesafely.com" className="text-blue-600 hover:underline">privacy@migratesafely.com</a>.
                </p>
              </CardContent>
            </Card>

            {/* International Transfers */}
            <Card>
              <CardHeader>
                <CardTitle>10. International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable data protection laws.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card>
              <CardHeader>
                <CardTitle>11. Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  We may update this Privacy Policy from time to time. We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Posting the updated policy on our website with a new "Last Updated" date</li>
                  <li>Sending email notification to registered members</li>
                  <li>Displaying a prominent notice on the platform</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  Your continued use of our services after changes take effect constitutes acceptance of the updated policy.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle>12. Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>Email:</strong> <a href="mailto:privacy@migratesafely.com" className="text-blue-600 hover:underline">privacy@migratesafely.com</a>
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>General Inquiries:</strong> <a href="mailto:support@migratesafely.com" className="text-blue-600 hover:underline">support@migratesafely.com</a>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    We will respond to your inquiry within 30 days.
                  </p>
                </div>
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