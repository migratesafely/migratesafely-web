import Head from "next/head";
import Link from "next/link";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function MemberAgreementPage() {
  return (
    <>
      <Head>
        <title>Member User Agreement | MigrateSafely.com</title>
        <meta name="description" content="Member User Agreement explaining legal rules, prize draws, referrals, and platform terms." />
        <meta name="keywords" content="migrate safely, migratesafely.com, safe migration platform, Bangladesh migration support, verified visa agents, trusted migration agents, connect with verified agents, approved visa consultant, work visa support Bangladesh, student visa support Bangladesh, visa scam prevention, report scam agent, scam blacklist database, migration fraud prevention, embassy contact directory, immigration resources Bangladesh, licensed migration agent signup, manpower license verification, free member prize draw, membership benefit rewards program" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Member User Agreement | MigrateSafely.com" />
        <meta property="og:description" content="Member User Agreement explaining legal rules, prize draws, referrals, and platform terms." />
        <meta property="og:url" content="https://migratesafely.com/member-agreement" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Member User Agreement | MigrateSafely.com" />
        <meta name="twitter:description" content="Member User Agreement explaining legal rules, prize draws, referrals, and platform terms." />
        <meta name="twitter:image" content="https://migratesafely.com/og-image.png" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://migratesafely.com/member-agreement" />
      </Head>

      <div className="min-h-screen bg-background">
        <MainHeader />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                Member User Agreement
              </h1>
              <p className="text-lg text-muted-foreground">
                Last Updated: January 21, 2026
              </p>
            </div>

            {/* Important Notice */}
            <Alert>
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base">
                <strong>By signing up you agree to this Member User Agreement.</strong>
                <br />
                Please read carefully before creating your account.
              </AlertDescription>
            </Alert>

            {/* 1. Nature of Platform */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1. Nature of Platform</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1.1 Introduction Service Only</h3>
                  <p>
                    MigrateSafely.com is an introduction-only platform that connects members with verified visa agents. 
                    We are <strong>NOT a visa agency</strong>, immigration law firm, or licensed migration consultant. 
                    We do not provide immigration advice, visa processing services, or guarantee visa approval outcomes.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">1.2 Platform Role</h3>
                  <p>
                    Our role is strictly limited to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Verifying agent credentials and licenses</li>
                    <li>Facilitating introductions between members and agents</li>
                    <li>Providing a scam reporting database</li>
                    <li>Offering community safety resources</li>
                    <li>Maintaining an embassy directory</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">1.3 Member Responsibility</h3>
                  <p>
                    Members are fully responsible for:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Conducting their own due diligence on agents</li>
                    <li>Negotiating terms and fees directly with agents</li>
                    <li>Verifying all claims made by agents independently</li>
                    <li>Understanding visa requirements for their destination country</li>
                    <li>Complying with all immigration laws and regulations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 2. Prize Draws */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2. Prize Draws</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.1 Nature of Prize Draws</h3>
                  <p>
                    Prize draws are <strong>completely free membership benefits</strong> for active paid members only. 
                    No tickets can be purchased, no additional payment is required beyond membership fees, and no payment 
                    increases chances of winning. This is a <strong>membership benefit program, not a lottery, gambling 
                    service, or game of chance offered to the public</strong>. Only active registered members with valid 
                    membership are eligible.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.2 Automatic Entry</h3>
                  <p>
                    All active paid members with membership valid within 365 days of payment are automatically entered 
                    into prize draws. No additional payment, entry form, or action is required beyond maintaining active membership.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.3 14-Day Claim Rule and Redraw</h3>
                  <p>
                    <strong>Winners must claim their prize within 14 calendar days</strong> of the announcement date. 
                    If a winner fails to claim within this period:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>The prize is forfeited and cannot be claimed later</li>
                    <li>A redraw will be conducted to select a new winner</li>
                    <li>The new winner will have another 14 days to claim</li>
                    <li>This process repeats until a valid claim is made or the prize expires</li>
                  </ul>
                  <p className="mt-2">
                    Winners will be notified via:
                  </p>
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Email to registered email address</li>
                    <li>Internal messaging system notification</li>
                    <li>Public announcement on Winners page</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.4 Prize Distribution</h3>
                  <p>
                    Prizes are distributed according to the specific terms of each prize draw. Members must:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Respond to winner notification within 14 days</li>
                    <li>Provide required verification information</li>
                    <li>Accept prize terms and conditions</li>
                    <li>Comply with any tax or legal requirements in their jurisdiction</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.5 No Guarantee</h3>
                  <p>
                    Prize draws are conducted at the Company's sole discretion. There is no guarantee of:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Frequency of prize draws</li>
                    <li>Value or type of prizes offered</li>
                    <li>Number of winners per draw</li>
                    <li>Continuation of the prize draw program</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.6 Disqualification</h3>
                  <p>
                    Members may be disqualified from prize draws for:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Expired or inactive membership</li>
                    <li>Terms of Service violations</li>
                    <li>Fraudulent activity or multiple accounts</li>
                    <li>Failure to meet eligibility requirements</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 3. Scam Reporting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">3. Scam Reporting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">3.1 Reporting Obligations</h3>
                  <p>
                    Members who submit scam reports must:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Provide truthful and accurate information</li>
                    <li>Include all relevant details and evidence</li>
                    <li>Upload supporting documentation (receipts, contracts, communications)</li>
                    <li>Not submit false, malicious, or defamatory reports</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3.2 Verification Process</h3>
                  <p>
                    All scam reports undergo administrative review before publication. The Company reserves the right to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Request additional evidence or clarification</li>
                    <li>Reject reports that lack sufficient evidence</li>
                    <li>Remove reports found to be false or misleading</li>
                    <li>Ban members who submit fraudulent reports</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3.3 Database Accuracy</h3>
                  <p>
                    While we make reasonable efforts to verify scam reports, the Company does not guarantee the accuracy, 
                    completeness, or reliability of any report in the scam database. Members use this information at their 
                    own risk.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3.4 Legal Disclaimer</h3>
                  <p>
                    Publishing a scam report on MigrateSafely.com does not constitute legal action, criminal complaint, 
                    or official report to authorities. Members who have been victims of fraud should:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>File a police report in their jurisdiction</li>
                    <li>Contact relevant immigration authorities</li>
                    <li>Seek legal counsel for civil remedies</li>
                    <li>Report to appropriate licensing bodies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 4. Referral Program */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">4. Referral Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">4.1 Referral Bonus</h3>
                  <p>
                    Members may earn referral bonuses by inviting new members to join the platform. Bonuses are credited 
                    when the referred member completes registration and activates their membership.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">4.2 Bonus Expiry</h3>
                  <p>
                    <strong>Referral bonuses expire 365 days (1 year) from the date of credit.</strong> Expired bonuses 
                    cannot be redeemed, transferred, or converted to cash. Members are responsible for tracking their 
                    bonus balances and expiry dates.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">4.3 Misuse Policy</h3>
                  <p>
                    The following actions constitute referral program misuse and will result in immediate disqualification 
                    and potential account termination:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Creating fake accounts to generate self-referrals</li>
                    <li>Using automated bots or scripts to generate referrals</li>
                    <li>Purchasing or selling referral codes</li>
                    <li>Spamming referral links on unrelated platforms</li>
                    <li>Misleading potential members about platform features</li>
                    <li>Offering unauthorized incentives for sign-ups</li>
                    <li>Coordinating referral schemes with other members</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">4.4 Bonus Forfeiture</h3>
                  <p>
                    The Company reserves the right to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Revoke bonuses earned through misuse</li>
                    <li>Suspend or terminate accounts engaged in fraudulent referrals</li>
                    <li>Modify or discontinue the referral program at any time</li>
                    <li>Change bonus amounts or redemption terms with notice</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">4.5 Redemption</h3>
                  <p>
                    Referral bonuses may be redeemed according to the current redemption policy. Bonuses cannot be:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Exchanged for cash</li>
                    <li>Transferred to other members</li>
                    <li>Combined with other promotions (unless explicitly allowed)</li>
                    <li>Redeemed after expiry</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 5. Membership and Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">5. Membership and Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">5.1 Membership Fees</h3>
                  <p>
                    Membership requires payment of annual fees in the member's local currency. Fees are set by the Company 
                    and may vary by country based on local economic conditions.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">5.2 No Refunds</h3>
                  <p>
                    All membership fees are <strong>non-refundable</strong>. This includes:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Partial year refunds</li>
                    <li>Unused membership periods</li>
                    <li>Voluntary account cancellation</li>
                    <li>Account termination for Terms violations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">5.3 Membership Duration</h3>
                  <p>
                    Memberships are valid for 365 days from the date of payment. Members must renew before expiry to 
                    maintain access to platform features and prize draw eligibility.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">5.4 Payment Processing</h3>
                  <p>
                    Payments are processed through third-party payment providers. The Company is not responsible for:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Payment processing delays or failures</li>
                    <li>Currency conversion fees</li>
                    <li>Banking or transaction fees</li>
                    <li>Payment provider terms or policies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 6. Liability Disclaimer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">6. Liability Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">6.1 No Liability for Agent Actions</h3>
                  <p>
                    MigrateSafely.com is <strong>NOT LIABLE</strong> for any actions, omissions, representations, or 
                    services provided by migration agents. This includes but is not limited to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Fraud, misrepresentation, or deceptive practices by agents</li>
                    <li>Visa application rejections or delays</li>
                    <li>Financial losses or damages incurred through agent services</li>
                    <li>Breach of contract between members and agents</li>
                    <li>Quality or legality of services provided by agents</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">6.2 No Guarantee of Outcomes</h3>
                  <p>
                    The Company makes no guarantees regarding:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Visa approval or immigration success</li>
                    <li>Agent performance or reliability</li>
                    <li>Accuracy of agent credentials (beyond initial verification)</li>
                    <li>Resolution of disputes between members and agents</li>
                    <li>Availability of agents in specific regions or specializations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">6.3 Information Accuracy</h3>
                  <p>
                    While we strive to provide accurate information, the Company is not liable for:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Errors or omissions in platform content</li>
                    <li>Outdated visa or immigration information</li>
                    <li>Inaccurate embassy contact details</li>
                    <li>Incorrect scam reports or database information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">6.4 Limitation of Liability</h3>
                  <p>
                    To the maximum extent permitted by law, the Company's total liability for any claims arising from 
                    membership shall not exceed the amount of annual membership fees paid by the member.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">6.5 Indemnification</h3>
                  <p>
                    Members agree to indemnify and hold harmless MigrateSafely.com, its officers, directors, employees, 
                    and agents from any claims, damages, losses, or expenses arising from:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Member's use of the platform</li>
                    <li>Member's interactions with agents</li>
                    <li>Member's violation of this Agreement or Terms of Service</li>
                    <li>Member's violation of any laws or regulations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 7. Privacy and Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">7. Privacy and Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">7.1 Data Collection</h3>
                  <p>
                    By signing up, members consent to the collection, use, and processing of personal data as described 
                    in our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">7.2 Information Sharing</h3>
                  <p>
                    Member information may be shared with verified agents for the purpose of facilitating introductions. 
                    Members control what information is shared through their privacy settings.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">7.3 Data Security</h3>
                  <p>
                    While we implement reasonable security measures, members acknowledge that no system is completely secure. 
                    The Company is not liable for unauthorized access to member data resulting from circumstances beyond 
                    our reasonable control.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 8. Account Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">8. Account Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">8.1 Voluntary Cancellation</h3>
                  <p>
                    Members may cancel their accounts at any time. No refunds will be provided for unused membership periods.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">8.2 Company Termination</h3>
                  <p>
                    The Company reserves the right to suspend or terminate accounts for:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Violation of this Agreement or Terms of Service</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Abuse of platform features</li>
                    <li>Harassment of other members or staff</li>
                    <li>Non-payment of membership fees</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">8.3 Effect of Termination</h3>
                  <p>
                    Upon termination, members lose access to:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Platform features and services</li>
                    <li>Prize draw eligibility</li>
                    <li>Unredeemed referral bonuses</li>
                    <li>Scam report submission privileges</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 9. Modifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">9. Modifications to Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  The Company reserves the right to modify this Member User Agreement at any time. Members will be 
                  notified of material changes via email and/or platform notification. Continued use of the platform 
                  after modifications constitutes acceptance of the updated Agreement.
                </p>
                <p>
                  Members who do not agree to modifications may cancel their membership, but no refunds will be provided.
                </p>
              </CardContent>
            </Card>

            {/* 10. Governing Law */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">10. Governing Law and Disputes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">10.1 Jurisdiction</h3>
                  <p>
                    This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction 
                    where the Company is registered, without regard to conflict of law principles.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">10.2 Dispute Resolution</h3>
                  <p>
                    Members agree to first attempt to resolve disputes through informal negotiation with the Company. 
                    If informal resolution fails, disputes shall be resolved through binding arbitration or in courts 
                    of competent jurisdiction.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 11. Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">11. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  For questions about this Member User Agreement, please contact us through our{" "}
                  <Link href="/contact" className="text-blue-600 hover:underline">
                    Contact Page
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>

            {/* Footer Links */}
            <div className="border-t pt-8">
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <Link 
                  href="/terms" 
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Terms of Service
                </Link>
                <Link 
                  href="/privacy" 
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/disclaimer" 
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Disclaimer
                </Link>
              </div>
            </div>

            {/* Acceptance Statement */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Important:</strong> By creating an account on MigrateSafely.com, you acknowledge that you have 
                read, understood, and agree to be bound by this Member User Agreement, our Terms of Service, Privacy Policy, 
                and Disclaimer.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    </>
  );
}