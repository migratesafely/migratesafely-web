import Head from "next/head";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, FileText, Users, XCircle } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <>
      <Head>
        <title>Disclaimer - MigrateSafely.com</title>
        <meta name="description" content="Important disclaimers and limitations: MigrateSafely.com is not a visa agency. We connect members to verified professionals but do not guarantee immigration outcomes." />
        <meta name="keywords" content="migrate safely, migratesafely.com, safe migration platform, Bangladesh migration support, verified visa agents, trusted migration agents, connect with verified agents, approved visa consultant, work visa support Bangladesh, student visa support Bangladesh, visa scam prevention, report scam agent, scam blacklist database, migration fraud prevention, embassy contact directory, immigration resources Bangladesh, licensed migration agent signup, manpower license verification, free member prize draw, membership benefit rewards program" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Disclaimer - MigrateSafely.com | Important Limitations" />
        <meta property="og:description" content="Important disclaimers and limitations: MigrateSafely.com is not a visa agency. We connect members to verified professionals but do not guarantee immigration outcomes." />
        <meta property="og:url" content="https://migratesafely.com/disclaimer" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Disclaimer - MigrateSafely.com | Important Limitations" />
        <meta name="twitter:description" content="Important disclaimers and limitations: MigrateSafely.com is not a visa agency. We connect members to verified professionals but do not guarantee immigration outcomes." />
        <meta name="twitter:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://migratesafely.com/disclaimer" />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Important Disclaimer
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Please read this disclaimer carefully to understand what MigrateSafely.com does and does not do.
            </p>
          </div>
        </section>

        {/* Critical Notice */}
        <section className="py-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-lg">
                <strong>CRITICAL NOTICE:</strong> MigrateSafely.com is NOT a visa processing agency, immigration consultant, or legal service provider. We are a connection platform only.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Main Disclaimers */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

            {/* What We Are NOT */}
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-6 w-6" />
                  What We Are NOT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">We Are NOT a Visa Processing Agency</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We do not:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Process visa applications</li>
                      <li>Submit documents to embassies or immigration authorities</li>
                      <li>Handle immigration paperwork</li>
                      <li>Fill out forms on your behalf</li>
                      <li>Act as agents, brokers, or representatives in visa processes</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">We Are NOT Immigration Consultants or Lawyers</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We do not:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Provide legal advice or immigration consulting</li>
                      <li>Interpret immigration laws or regulations</li>
                      <li>Advise on case strategy or eligibility</li>
                      <li>Represent you in legal or administrative proceedings</li>
                      <li>Review or assess your immigration case</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">We Do NOT Employ or Control Agents</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Agents connected through our platform are independent professionals. We do not:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Employ agents as staff or contractors</li>
                      <li>Control or direct their services</li>
                      <li>Supervise their work or methods</li>
                      <li>Set their fees or payment terms</li>
                      <li>Take responsibility for their actions or omissions</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">We Do NOT Guarantee Outcomes</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We cannot and do not guarantee:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Visa approval or immigration success</li>
                      <li>Specific timelines or processing speeds</li>
                      <li>Agent availability or acceptance of your case</li>
                      <li>Quality or results of agent services</li>
                      <li>Employment, residency, or citizenship outcomes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What We ARE */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Shield className="h-6 w-6" />
                  What We ARE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">A Connection Platform</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We facilitate connections between members and verified migration agents through a secure, request-based system. We verify agent credentials but members are responsible for evaluating agents and making informed decisions.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">A Community Protection Resource</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We maintain a verified scam report database to help members avoid known fraudsters. We verify reports to the best of our ability but cannot guarantee complete accuracy.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">An Information Hub</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We provide access to official embassy contact information and educational resources about migration safety. This information is for reference only and should be verified through official government sources.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">A Member Benefit Platform</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We offer members-only prize draws and support services as part of the membership benefits. Prize draws are conducted fairly but we reserve the right to modify or cancel draws.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Responsibilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  Your Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  When using MigrateSafely.com, you are responsible for:
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Due Diligence on Agents</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Verifying agent credentials, licenses, and qualifications</li>
                      <li>Checking agent background and track record</li>
                      <li>Reviewing and understanding all contracts before signing</li>
                      <li>Negotiating fees and payment terms directly with agents</li>
                      <li>Ensuring agents are authorized to practice in your jurisdiction</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Immigration Case</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Understanding your eligibility and requirements</li>
                      <li>Providing accurate and complete information</li>
                      <li>Meeting all deadlines and obligations</li>
                      <li>Following official immigration procedures</li>
                      <li>Accepting that visa outcomes depend on government decisions, not our platform</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Financial Decisions</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Understanding all costs and fees before committing</li>
                      <li>Ensuring you can afford the services</li>
                      <li>Not making payments you cannot afford to lose</li>
                      <li>Keeping records of all transactions</li>
                      <li>Understanding that membership fees are separate from agent fees</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Verification and Research</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Verifying all information through official sources</li>
                      <li>Consulting with licensed professionals when needed</li>
                      <li>Not relying solely on our platform for immigration advice</li>
                      <li>Checking official government websites for requirements and processes</li>
                      <li>Seeking independent legal advice if necessary</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-orange-600" />
                  Independent Agent Relationships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Direct Contracts</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Any services, agreements, or payments between you and an agent are strictly between you and that agent. MigrateSafely.com is not a party to these agreements and assumes no liability for them.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Payment to Agents</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      All payments for agent services are made directly between you and the agent. We do not process, facilitate, hold, or take any commission from these payments. We are not responsible for payment disputes, refunds, or financial losses related to agent fees.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Agent Performance</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      While we verify agent credentials before adding them to our network, we cannot guarantee their performance, service quality, or results. You are responsible for evaluating agents and monitoring their work.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Disputes with Agents</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      If you have a dispute with an agent, you must resolve it directly with them. We are not responsible for mediating or resolving disputes, though you may report serious issues through our scam reporting system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scam Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Scam Reports Disclaimer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Regarding our scam report database:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Reports are submitted by members and verified by our team to the best of our ability</li>
                  <li>We cannot guarantee 100% accuracy of all reports</li>
                  <li>Reports may be based on incomplete information</li>
                  <li>Listings in the database do not constitute legal findings of fraud</li>
                  <li>You use this information at your own risk and should conduct independent verification</li>
                  <li>We are not liable for consequences arising from your use of this information</li>
                  <li>Reports are published in good faith for community protection</li>
                </ul>
              </CardContent>
            </Card>

            {/* Prize Draws */}
            <Card>
              <CardHeader>
                <CardTitle>Prize Draws Disclaimer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Regarding our prize draws:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Prize draws are completely free membership benefits for active paid members only</li>
                  <li>No tickets can be purchased, no additional payment is required beyond membership fees</li>
                  <li>This is a membership benefit program, not a lottery, gambling service, or public game of chance</li>
                  <li>Only active registered members with valid membership are eligible</li>
                  <li>Prize draws are a membership benefit, not a guaranteed entitlement</li>
                  <li>We reserve the right to modify, postpone, or cancel prize draws</li>
                  <li>Winners must respond within 14 days or prizes may be forfeited</li>
                  <li>Prize forfeiture may occur due to non-response, rule violations, or fraud</li>
                  <li>We may redraw winners if prizes are unclaimed or forfeited</li>
                  <li>Prize values and types may vary between draws</li>
                  <li>Additional terms may apply to specific prize draws</li>
                  <li>Tax obligations related to prizes are the winner's responsibility</li>
                </ul>
              </CardContent>
            </Card>

            {/* No Warranty */}
            <Card>
              <CardHeader>
                <CardTitle>No Warranty of Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  MigrateSafely.com is provided "as is" and "as available" without any warranties, express or implied. We do not warrant that:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>The platform will meet your specific needs or expectations</li>
                  <li>Agent connections will result in successful outcomes</li>
                  <li>Information on the platform is complete, accurate, or up-to-date</li>
                  <li>The platform will be error-free or uninterrupted</li>
                  <li>Any particular agent will be available or accept your case</li>
                </ul>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-100">Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  MigrateSafely.com, its owners, directors, employees, and affiliates shall not be liable for any:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Visa denials, immigration failures, or adverse outcomes</li>
                  <li>Actions or omissions of independent agents</li>
                  <li>Financial losses from agent fees or services</li>
                  <li>Disputes between members and agents</li>
                  <li>Reliance on platform information or scam reports</li>
                  <li>Prize draw outcomes, forfeiture, or modifications</li>
                  <li>Delays, errors, or interruptions in service</li>
                  <li>Loss of data, opportunities, or business</li>
                  <li>Any indirect, incidental, special, or consequential damages</li>
                </ul>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle>Our Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  We strongly recommend that you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Consult Official Sources:</strong> Always verify immigration requirements through official government websites and embassies</li>
                  <li><strong>Seek Professional Advice:</strong> Consult with licensed immigration lawyers or consultants for complex cases</li>
                  <li><strong>Conduct Due Diligence:</strong> Thoroughly research and verify any agent before engaging their services</li>
                  <li><strong>Understand Costs:</strong> Ensure you fully understand all costs before making any payments</li>
                  <li><strong>Keep Records:</strong> Maintain documentation of all communications, agreements, and payments</li>
                  <li><strong>Be Cautious:</strong> If something seems too good to be true, it probably is</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Questions About This Disclaimer?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  If you have questions about this disclaimer or our services, contact us:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  <strong>Email:</strong> <a href="mailto:support@migratesafely.com" className="text-blue-600 hover:underline">support@migratesafely.com</a>
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  For legal matters: Please review our <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
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