import Head from "next/head";
import { Card } from "@/shared/components/ui/card";
import { useI18n } from "@/shared/contexts/I18nContext";

export default function TermsPage() {
  const { t } = useI18n();
  return (
    <>
      <Head>
        <title>Terms of Service - Plan2Fund | Legal Terms & Conditions</title>
        <meta name="description" content="Read Plan2Fund's Terms of Service, including user responsibilities, payment terms, intellectual property rights, and legal obligations." />
        <meta property="og:title" content={t('terms.ogTitle')} />
        <meta property="og:description" content="Read Plan2Fund's Terms of Service and legal terms for using our business planning platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://plan2fund.com/legal/terms" />
        <link rel="canonical" href="https://plan2fund.com/legal/terms" />
      </Head>
      
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose max-w-none">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('terms.title')}</h1>
        <p className="text-gray-600 mb-6">
          {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
        </p>

        {/* Legal Pages Navigation */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <a href="/legal/privacy" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              {t('terms.navigation.privacy')}
            </a>
            <a href="/about" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              {t('terms.navigation.legal')}
            </a>
            <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              {t('terms.navigation.contact')}
            </a>
          </div>
        </div>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">{t('terms.section1.title')}</h2>
          <p className="text-sm text-gray-700 mb-3">
            {t('terms.section1.content')}
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">{t('terms.section2.title')}</h2>
          <p className="text-sm text-gray-700 mb-3">
            Plan2Fund provides an online platform for finding funding opportunities, creating business plans, and accessing expert guidance. The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue it at any time.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">3. User Accounts & Responsibilities</h2>
          <p className="text-sm text-gray-700 mb-3">
            To use certain features, you must create an account with accurate information and maintain account security. You agree to use the Service only for lawful purposes and not to:
          </p>
          <ul className="list-disc list-inside mb-3 space-y-1 text-sm text-gray-700">
            <li>Use the Service for illegal purposes or violate any laws</li>
            <li>Transmit viruses or malicious code</li>
            <li>Attempt unauthorized access or interfere with the Service</li>
            <li>Provide false or misleading information</li>
          </ul>
          <p className="text-sm text-gray-700">
            We may terminate accounts that violate these terms.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
          <p className="text-sm text-gray-700 mb-3">
            The Service and its content are owned by Plan2Fund and protected by intellectual property laws. You retain ownership of content you create, but grant us a limited license to use it for providing the Service.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">5. Payment Terms</h2>
          <p className="text-sm text-gray-700 mb-3">
            Some features require payment. Fees are non-refundable unless stated otherwise. We offer a 30-day money-back guarantee for new subscriptions. Payment is due in advance, and we may suspend accounts for non-payment.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">6. Privacy & Data</h2>
          <p className="text-sm text-gray-700">
            Your privacy is important to us. Please review our <a href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> to understand our data practices.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">7. Disclaimers & Liability</h2>
          <p className="text-sm text-gray-700 mb-3">
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PLAN2FUND SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.
          </p>
          <p className="text-sm text-gray-700">
            Our total liability shall not exceed the amount you paid us in the twelve months preceding any claim.
          </p>
        </Card>

        <Card className="p-6 mb-6 bg-white shadow-sm border-neutral-200">
          <h2 className="text-xl font-semibold mb-3">8. Legal & Contact</h2>
          <p className="text-sm text-gray-700 mb-3">
            These terms are governed by Austrian law. Disputes shall be subject to the exclusive jurisdiction of the courts of Vienna, Austria.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold mb-2">Contact:</p>
            <p className="text-sm text-gray-700"><strong>Email:</strong> legal@plan2fund.com</p>
            <p className="text-sm text-gray-700"><strong>Address:</strong> Mariahilfer Straße 123, 1060 Vienna, Austria</p>
          </div>
        </Card>
      </div>
        </div>
      </div>
    </>
  );
}

