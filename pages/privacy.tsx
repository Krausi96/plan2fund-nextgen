import Head from "next/head";
import { Card } from "@/shared/components/ui/card";
import { useI18n } from "@/shared/contexts/I18nContext";

export default function PrivacyPage() {
  const { t } = useI18n();
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
      
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose max-w-none">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('privacy.title')}</h1>
        <p className="text-gray-600 mb-6">
          {t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}
        </p>

        {/* Legal Pages Navigation */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <a href="/terms" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              {t('privacy.navigation.terms')}
            </a>
            <a href="/about" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              {t('privacy.navigation.legal')}
            </a>
            <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              {t('privacy.navigation.contact')}
            </a>
          </div>
        </div>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">{t('privacy.section1.title')}</h2>
          <p className="text-sm text-gray-700 mb-3">
            {t('privacy.section1.content')}
          </p>
          <p className="text-sm text-gray-700 mb-3">
            We collect information you provide (name, email, business details) and automatically collect usage data (device info, pages visited, cookies) to provide and improve our services.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">2. How We Use & Share Information</h2>
          <p className="text-sm text-gray-700 mb-3">
            We use your information to provide services, process transactions, respond to inquiries, and improve our platform. We do not sell your data. We may share information with:
          </p>
          <ul className="list-disc list-inside mb-3 space-y-1 text-sm text-gray-700">
            <li>Trusted service providers who assist in operating our service</li>
            <li>Legal authorities when required by law</li>
            <li>Third parties with your explicit consent</li>
          </ul>
        </Card>

        <Card id="security" className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">3. Data Security</h2>
          <p className="text-sm text-gray-700 mb-3">
            We implement technical and organizational measures to protect your data against unauthorized access, loss, or breaches. However, no internet transmission is 100% secure.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">4. Your Rights (GDPR)</h2>
          <p className="text-sm text-gray-700 mb-3">
            Under GDPR, you have the right to access, rectify, erase, port, object to, or restrict processing of your personal data. To exercise these rights, contact us at privacy@plan2fund.com
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">5. Cookies & Data Retention</h2>
          <p className="text-sm text-gray-700 mb-3">
            We use essential, analytics, preference, and marketing cookies (with consent). You can control cookies through your browser settings.
          </p>
          <p className="text-sm text-gray-700">
            We retain your data as long as necessary to provide services or as required by law. When you delete your account, we delete or anonymize your data except where legally required.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">6. Additional Information</h2>
          <p className="text-sm text-gray-700 mb-3">
            Our service is not intended for children under 16. We may transfer data internationally with appropriate safeguards. We may update this policy and will notify you of material changes.
          </p>
        </Card>

        <Card className="p-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
          <p className="text-sm text-gray-700 mb-3">
            Questions about this privacy policy? Contact us:
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700"><strong>Email:</strong> privacy@plan2fund.com</p>
            <p className="text-sm text-gray-700"><strong>Address:</strong> Mariahilfer Straße 123, 1060 Vienna, Austria</p>
          </div>
        </Card>
      </div>
        </div>
      </div>
    </>
  );
}
