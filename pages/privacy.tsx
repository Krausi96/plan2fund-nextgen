import Head from "next/head";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Plan2Fund | Data Protection & GDPR Compliance</title>
        <meta name="description" content="Learn about Plan2Fund's privacy policy, data protection practices, and GDPR compliance. Understand how we collect, use, and protect your personal information." />
        <meta property="og:title" content="Privacy Policy - Plan2Fund | Data Protection & GDPR" />
        <meta property="og:description" content="Learn about Plan2Fund's privacy policy and data protection practices in compliance with GDPR." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://plan2fund.com/privacy" />
        <link rel="canonical" href="https://plan2fund.com/privacy" />
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-lg text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        {/* Legal Pages Navigation */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Related Legal Documents</h3>
          <div className="flex flex-wrap gap-4">
            <a href="/legal" className="text-blue-600 hover:text-blue-700 font-medium">
              Legal Notice
            </a>
            <a href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms & Conditions
            </a>
            <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Us
            </a>
          </div>
        </div>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <h3 className="text-xl font-medium mb-3">1.1 Personal Information</h3>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Create an account or profile</li>
            <li>Use our funding recommendation service</li>
            <li>Create or edit business plans</li>
            <li>Contact us for support</li>
            <li>Subscribe to our newsletter</li>
          </ul>
          <p className="mb-4">
            This information may include your name, email address, phone number, 
            business information, and any other information you choose to provide.
          </p>

          <h3 className="text-xl font-medium mb-3">1.2 Usage Information</h3>
          <p className="mb-4">
            We automatically collect certain information about your use of our service, including:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, features used)</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Log files and analytics data</li>
          </ul>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Personalize your experience and provide recommendations</li>
            <li>Monitor and analyze trends and usage</li>
            <li>Detect, investigate, and prevent security incidents</li>
          </ul>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties 
            without your consent, except in the following circumstances:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li><strong>Service Providers:</strong> We may share information with trusted third parties who assist us in operating our service</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
            <li><strong>Consent:</strong> When you explicitly consent to sharing your information</li>
          </ul>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Unauthorized access, use, or disclosure</li>
            <li>Accidental loss or destruction</li>
            <li>Malicious attacks and data breaches</li>
          </ul>
          <p className="mb-4">
            However, no method of transmission over the internet or electronic storage is 100% secure. 
            While we strive to protect your information, we cannot guarantee absolute security.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights (GDPR)</h2>
          <p className="mb-4">Under the General Data Protection Regulation, you have the right to:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li><strong>Access:</strong> Request copies of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Objection:</strong> Object to processing of your personal data</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
          </ul>
          <p className="mb-4">
            To exercise these rights, please contact us at privacy@plan2fund.com
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to enhance your experience and analyze usage patterns. 
            You can control cookie settings through your browser preferences.
          </p>
          <h3 className="text-xl font-medium mb-3">Types of cookies we use:</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li><strong>Essential cookies:</strong> Required for basic functionality</li>
            <li><strong>Analytics cookies:</strong> Help us understand how you use our service</li>
            <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            <li><strong>Marketing cookies:</strong> Used for targeted advertising (with consent)</li>
          </ul>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p className="mb-4">
            We retain your personal information for as long as necessary to provide our services 
            and fulfill the purposes outlined in this privacy policy, unless a longer retention 
            period is required or permitted by law.
          </p>
          <p className="mb-4">
            When you delete your account, we will delete or anonymize your personal information, 
            except where we are required to retain it for legal or regulatory purposes.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. International Transfers</h2>
          <p className="mb-4">
            Your information may be transferred to and processed in countries other than your own. 
            We ensure that such transfers comply with applicable data protection laws and implement 
            appropriate safeguards to protect your information.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
          <p className="mb-4">
            Our service is not intended for children under 16 years of age. We do not knowingly 
            collect personal information from children under 16. If you are a parent or guardian 
            and believe your child has provided us with personal information, please contact us.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes 
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
          <p className="mb-4">
            We encourage you to review this privacy policy periodically for any changes.
          </p>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this privacy policy or our data practices, please contact us:
          </p>
          <div className="space-y-2">
            <p><strong>Email:</strong> privacy@plan2fund.com</p>
            <p><strong>Address:</strong> Mariahilfer Straße 123, 1060 Vienna, Austria</p>
            <p><strong>Phone:</strong> +43 1 234 5678</p>
          </div>
        </Card>
      </div>
      </div>
    </>
  );
}
