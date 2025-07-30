import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Privacy Policy | Streetwise Self Defense</title>
        <meta name="description" content="Privacy policy for Streetwise Self Defense. Learn how we collect, use, and protect your personal information in compliance with California law." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://streetwiseselfdefense.com/privacy-policy" />
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-accent-primary hover:text-accent-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-navy py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-accent-primary/20 p-4 rounded-full">
              <Shield className="w-8 h-8 text-accent-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-300">
            Your privacy is important to us. Learn how we protect and use your information.
          </p>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-accent-light/30 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-navy mb-4 flex items-center">
              <Eye className="w-6 h-6 mr-3 text-accent-primary" />
              Privacy at a Glance
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-accent-primary/10 p-3 rounded-lg inline-block mb-3">
                  <Lock className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-semibold text-navy mb-2">We Don't Sell Data</h3>
                <p className="text-gray-600 text-sm">Your information is never sold to third parties</p>
              </div>
              <div className="text-center">
                <div className="bg-accent-primary/10 p-3 rounded-lg inline-block mb-3">
                  <FileText className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-semibold text-navy mb-2">Service Only</h3>
                <p className="text-gray-600 text-sm">We only use your data to provide our training services</p>
              </div>
              <div className="text-center">
                <div className="bg-accent-primary/10 p-3 rounded-lg inline-block mb-3">
                  <Shield className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-semibold text-navy mb-2">Secure Storage</h3>
                <p className="text-gray-600 text-sm">Enterprise-grade security with SOC 2 compliant providers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 lg:p-12">

            {/* Last Updated */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Effective Date:</strong> 07/29/25<br />
                <strong>Last Updated:</strong> 07/29/25
              </p>
            </div>

            {/* Introduction */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-navy mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Streetwise Self Defense ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect information when you visit our website or submit forms to us.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-navy mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-navy mb-3">Information You Provide to Us:</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                <li>Name, email address, and phone number (when you submit contact forms)</li>
                <li>Organization/company information (for workplace safety inquiries)</li>
                <li>Training preferences and requirements</li>
                <li>Any additional information you choose to provide in form submissions</li>
              </ul>

              <h3 className="text-lg font-semibold text-navy mb-3">Automatically Collected Information:</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                <li>Website usage data through Google Analytics (pages visited, time spent, general location)</li>
                <li>IP address and browser information</li>
                <li>Cookies for website functionality</li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-navy mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your personal information solely to:</p>
              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                <li>Respond to your inquiries about our self-defense training services</li>
                <li>Schedule consultations and training sessions</li>
                <li>Provide information about our programs that match your interests</li>
                <li>Send occasional updates about our services (only if you opt-in)</li>
                <li>Manage customer relationships and follow-up communications</li>
                <li>Improve our website and services</li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">We do NOT:</h3>
                <ul className="list-disc pl-6 text-red-700 space-y-1">
                  <li>Sell your personal information to third parties</li>
                  <li>Share your information for marketing purposes</li>
                  <li>Use your information for any purpose other than providing our services</li>
                </ul>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-navy mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We may share your information only in these limited circumstances:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> With Airtable (our database provider), Zoho CRM (our customer relationship management system), and other essential service providers who help us operate our business</li>
                <li><strong>Legal Requirements:</strong> If required by law, court order, or to protect our legal rights</li>
                <li><strong>Business Transfer:</strong> In the unlikely event of a business sale or merger</li>
              </ul>
              <p className="text-gray-700 text-sm italic">
                All service providers are required to maintain the confidentiality and security of your personal information and may only use it to provide services to us.
              </p>
            </div>

            {/* Data Storage and Security */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-navy mb-4">5. Data Storage and Security</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Your information is stored securely using industry-standard practices</li>
                <li>We use Airtable and Zoho CRM as our primary data storage providers, both of which maintain SOC 2 compliance and enterprise-grade security</li>
                <li>We retain your information only as long as necessary to provide our services, maintain our customer relationships, or as required by law</li>
                <li>You may request deletion of your information at any time, subject to any legal retention requirements</li>
              </ul>
            </div>

            {/* California Privacy Rights */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-navy mb-4">6. Your California Privacy Rights</h2>
              <p className="text-gray-700 mb-4">Under the California Consumer Privacy Act (CCPA), California residents have the right to:</p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-accent-light/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-navy mb-2">Right to Know</h3>
                  <p className="text-gray-700 text-sm">Request information about what personal information we collect, use, and share</p>
                </div>
                <div className="bg-accent-light/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-navy mb-2">Right to Delete</h3>
                  <p className="text-gray-700 text-sm">Request deletion of your personal information</p>
                </div>
                <div className="bg-accent-light/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-navy mb-2">Right to Opt-Out</h3>
                  <p className="text-gray-700 text-sm">Opt-out of the sale of personal information (Note: We do not sell personal information)</p>
                </div>
                <div className="bg-accent-light/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-navy mb-2">Right to Non-Discrimination</h3>
                  <p className="text-gray-700 text-sm">Receive equal service regardless of exercising your privacy rights</p>
                </div>
              </div>

              <p className="text-gray-700">
                <strong>To exercise these rights, contact us at:</strong> info@streetwiseselfdefense.com or 925-532-9953.
              </p>
            </div>

            {/* Cookies and Tracking */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-navy mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">We use:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Essential Cookies:</strong> For website functionality and security</li>
                <li><strong>Analytics Cookies:</strong> Google Analytics to understand website usage (anonymized data)</li>
                <li><strong>reCAPTCHA:</strong> Google reCAPTCHA to prevent spam on our forms</li>
              </ul>
              <p className="text-gray-700 text-sm mt-4">
                You can disable cookies in your browser, but some website features may not work properly.
              </p>
            </div>

            {/* Additional Sections */}
            <div className="space-y-8">

              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">8. Third-Party Links</h2>
                <p className="text-gray-700">
                  Our website may contain links to third-party websites (such as Calendly for scheduling). This privacy policy does not apply to those sites. Please review their privacy policies.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700">
                  Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. Our mother-daughter classes serve children 12-15 with parental consent.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update this privacy policy occasionally. We will notify you of significant changes by posting the new policy on our website with a new "Last Updated" date.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">11. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about this privacy policy or want to exercise your privacy rights, contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Streetwise Self Defense</strong><br />
                    Email: info@streetwiseselfdefense.com<br />
                    Phone: 925-532-9953<br />
                    
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">12. Consent</h2>
                <p className="text-gray-700">
                  By using our website and submitting forms, you consent to the collection and use of your information as described in this privacy policy.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Questions About Your Privacy?</h2>
          <p className="text-xl text-gray-300 mb-8">
            We're here to help you understand how we protect your information.
          </p>
          <Link
            to="/contact"
            className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;