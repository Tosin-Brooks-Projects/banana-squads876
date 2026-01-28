'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-neutral-900">Unboring Surveys</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-neutral-900"
          >
            Terms of{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Service</span>
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
              <h2 className="text-xl font-bold text-neutral-900 mt-0">1. Agreement to Terms</h2>
              <p className="text-neutral-600">
                By accessing or using Unboring Surveys (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">2. Description of Service</h2>
              <p className="text-neutral-600">
                Unboring Surveys is a survey creation and response collection platform that transforms
                traditional surveys into engaging, gamified experiences. Our Service allows users to
                create surveys with interactive themes (such as Ice Cream Sundae Builder, Pizza Builder,
                Garden Grower, and more), collect responses, and analyze results through our dashboard.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">3. User Accounts</h2>
              <p className="text-neutral-600">
                To use certain features of the Service, you must create an account. You are responsible
                for maintaining the confidentiality of your account credentials and for all activities
                that occur under your account. You agree to:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Keep your login credentials secure and confidential</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">4. Acceptable Use</h2>
              <p className="text-neutral-600">
                You agree not to use the Service to:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Collect personal information without proper consent</li>
                <li>Distribute spam, malware, or harmful content</li>
                <li>Impersonate others or misrepresent your affiliation</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
              </ul>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">5. Survey Content</h2>
              <p className="text-neutral-600">
                You retain ownership of the content you create through our Service, including survey
                questions and collected responses. However, you grant us a limited license to store,
                process, and display your content as necessary to provide the Service. You are solely
                responsible for the content of your surveys and ensuring they comply with applicable
                laws and regulations.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">6. Pricing and Payments</h2>
              <p className="text-neutral-600">
                Unboring Surveys offers both free and paid tiers. Free accounts have limitations on
                response counts and data retention. Paid features are charged on a per-survey basis
                as displayed on our pricing page. All payments are processed securely through Stripe.
                Prices are subject to change with reasonable notice.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">7. Data Retention</h2>
              <p className="text-neutral-600">
                Data retention periods vary by tier:
              </p>
              <ul className="text-neutral-600 list-disc pl-6 space-y-2">
                <li>Free tier: 30 days</li>
                <li>Starter tier: 90 days</li>
                <li>Pro tier and above: 1 year</li>
              </ul>
              <p className="text-neutral-600 mt-4">
                After the retention period, survey data may be permanently deleted. Paid tiers can
                export data at any time before deletion.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">8. Intellectual Property</h2>
              <p className="text-neutral-600">
                The Service, including its original content, features, and functionality, is owned
                by Unboring Surveys and is protected by international copyright, trademark, and other
                intellectual property laws. Our trademarks and trade dress may not be used without
                our prior written permission.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">9. Disclaimer of Warranties</h2>
              <p className="text-neutral-600">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
                either express or implied. We do not warrant that the Service will be uninterrupted,
                secure, or error-free.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">10. Limitation of Liability</h2>
              <p className="text-neutral-600">
                To the maximum extent permitted by law, Unboring Surveys shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including loss of
                profits, data, or goodwill, arising from your use of the Service.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">11. Termination</h2>
              <p className="text-neutral-600">
                We reserve the right to suspend or terminate your access to the Service at any time,
                with or without cause, and with or without notice. Upon termination, your right to
                use the Service will immediately cease.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">12. Changes to Terms</h2>
              <p className="text-neutral-600">
                We may modify these Terms at any time. We will notify users of any material changes
                by posting the updated Terms on this page with a new &quot;Last updated&quot; date. Your
                continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">13. Governing Law</h2>
              <p className="text-neutral-600">
                These Terms shall be governed by and construed in accordance with the laws of the
                State of Texas, United States, without regard to its conflict of law provisions.
              </p>

              <h2 className="text-xl font-bold text-neutral-900 mt-8">14. Contact Us</h2>
              <p className="text-neutral-600">
                If you have any questions about these Terms of Service, please contact us on X (Twitter):{' '}
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
