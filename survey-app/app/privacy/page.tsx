'use client';

import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader />

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-neutral-900"
          >
            Privacy{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Policy</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-brand-200 -z-0"></span>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-neutral-600"
          >
            Last updated: January 28, 2026
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-neutral-200 p-8 md:p-12"
          >
            <div className="prose prose-neutral max-w-none">
              <p className="text-neutral-600 text-lg">
                At Unboring Surveys, we take your privacy seriously. This Privacy Policy explains how
                we collect, use, disclose, and safeguard your information when you use our survey
                creation and response collection platform.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">1. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-neutral-800 mt-6">Account Information</h3>
              <p className="text-neutral-600">
                When you create an account, we collect:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Email address</li>
                <li>Display name</li>
                <li>Profile photo (if provided)</li>
                <li>Username</li>
              </ul>

              <h3 className="text-lg font-semibold text-neutral-800 mt-6">Survey Data</h3>
              <p className="text-neutral-600">
                When you create surveys or respond to surveys, we collect:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Survey questions and configuration</li>
                <li>Survey responses from respondents</li>
                <li>Completion timestamps and duration</li>
                <li>Anonymous analytics data (completion rates, drop-off points)</li>
              </ul>

              <h3 className="text-lg font-semibold text-neutral-800 mt-6">Usage Information</h3>
              <p className="text-neutral-600">
                We automatically collect certain information when you use our Service:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address</li>
                <li>Pages visited and features used</li>
                <li>Time and date of visits</li>
              </ul>

              <h3 className="text-lg font-semibold text-neutral-800 mt-6">Payment Information</h3>
              <p className="text-neutral-600">
                For paid features, payment processing is handled by Stripe. We do not store your
                full credit card number, CVV, or other sensitive payment details on our servers.
                We only receive confirmation of successful payments and basic transaction information.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">2. How We Use Your Information</h2>
              <p className="text-neutral-600">
                We use the information we collect to:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
                <li>Personalize and improve your experience</li>
              </ul>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">3. AI-Powered Features</h2>
              <p className="text-neutral-600">
                Our Service includes AI-powered features for generating survey questions. When you
                use these features:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Your input prompts are sent to our AI providers (Anthropic) to generate suggestions</li>
                <li>We do not use your survey content to train AI models</li>
                <li>AI-generated suggestions are provided as recommendations that you can edit or reject</li>
              </ul>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">4. Information Sharing</h2>
              <p className="text-neutral-600">
                We do not sell your personal information. We may share your information in the
                following circumstances:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> We share information with third-party vendors
                  who perform services on our behalf (e.g., hosting, payment processing, analytics)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law
                  or in response to valid legal requests</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or
                  sale of assets, your information may be transferred</li>
                <li><strong>With Your Consent:</strong> We may share information for other purposes
                  with your explicit consent</li>
              </ul>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">5. Data Retention</h2>
              <p className="text-neutral-600">
                We retain your information for as long as your account is active or as needed to
                provide you with our Service. Survey data retention depends on your account tier:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li><strong>Free tier:</strong> 30 days</li>
                <li><strong>Starter tier:</strong> 90 days</li>
                <li><strong>Pro tier and above:</strong> 1 year</li>
              </ul>
              <p className="text-neutral-600 mt-4">
                You can export your data at any time (paid tiers) or request deletion of your account
                and associated data by contacting us.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">6. Data Security</h2>
              <p className="text-neutral-600">
                We implement appropriate technical and organizational measures to protect your
                information, including:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure cloud infrastructure (Firebase/Google Cloud)</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="text-neutral-600 mt-4">
                However, no method of transmission over the Internet is 100% secure. We cannot
                guarantee absolute security of your data.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">7. Your Rights and Choices</h2>
              <p className="text-neutral-600">
                Depending on your location, you may have certain rights regarding your personal
                information:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
              </ul>
              <p className="text-neutral-600 mt-4">
                To exercise these rights, please contact us using the information below.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">8. Cookies and Tracking</h2>
              <p className="text-neutral-600">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences</li>
                <li>Analyze how our Service is used</li>
                <li>Improve our Service</li>
              </ul>
              <p className="text-neutral-600 mt-4">
                You can control cookies through your browser settings. Note that disabling cookies
                may affect the functionality of our Service.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">9. Third-Party Services</h2>
              <p className="text-neutral-600">
                Our Service integrates with the following third-party services:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li><strong>Firebase (Google):</strong> Authentication and database services</li>
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Anthropic:</strong> AI-powered question generation</li>
                <li><strong>Google Analytics:</strong> Usage analytics</li>
              </ul>
              <p className="text-neutral-600 mt-4">
                These services have their own privacy policies governing the use of your information.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">10. Children&apos;s Privacy</h2>
              <p className="text-neutral-600">
                Our Service is not intended for children under 13 years of age. We do not knowingly
                collect personal information from children under 13. If you believe we have collected
                information from a child under 13, please contact us immediately.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">11. International Data Transfers</h2>
              <p className="text-neutral-600">
                Your information may be transferred to and processed in countries other than your
                own. We ensure appropriate safeguards are in place to protect your information in
                accordance with this Privacy Policy.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">12. Changes to This Policy</h2>
              <p className="text-neutral-600">
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the new Privacy Policy on this page and updating the
                &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">13. Contact Us</h2>
              <p className="text-neutral-600">
                If you have any questions about this Privacy Policy or our data practices, please
                contact us on X (Twitter):{' '}
                <a
                  href="https://x.com/brooksconkle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:text-brand-600"
                >
                  @brooksconkle
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
