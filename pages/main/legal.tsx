import Head from "next/head";
import { useState } from "react";
import { useI18n } from "@/shared/contexts/I18nContext";

export default function Legal() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'legal' | 'privacy' | 'terms'>('legal');

  const tabs = [
    { id: 'legal', label: t('legal.tabs.legal'), content: 'legal' },
    { id: 'privacy', label: t('legal.tabs.privacy'), content: 'privacy' },
    { id: 'terms', label: t('legal.tabs.terms'), content: 'terms' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'legal':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('legal.company.title')}</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>{t('legal.company.name')}:</strong> {t('legal.company.value')}</li>
              <li><strong>{t('legal.company.address')}:</strong> {t('legal.company.addressValue')}</li>
              <li><strong>{t('legal.company.email')}:</strong> {t('legal.company.emailValue')}</li>
              <li><strong>{t('legal.company.vat')}:</strong> {t('legal.company.vatValue')}</li>
            </ul>
          </div>
        );
      case 'privacy':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('privacy.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('privacy.section1.content')}
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><b>{t('legal.company.name')}:</b> {t('legal.company.value')}</li>
              <li><b>{t('legal.company.address')}:</b> {t('legal.company.addressValue')}</li>
              <li><b>{t('legal.company.email')}:</b> {t('legal.company.emailValue')}</li>
              <li><b>{t('legal.company.vat')}:</b> {t('legal.company.vatValue')}</li>
              <li><b>{t('legal.company.director')}:</b> {t('legal.company.directorValue')}</li>
            </ul>
            <p className="text-gray-600 mt-6">
              {t('legal.dispute.title')}: {t('legal.dispute.text')}
              <a href={t('legal.dispute.link')} className="text-blue-600 hover:underline"> {t('legal.dispute.link')}</a>.
            </p>
          </div>
        );
      case 'terms':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('terms.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('terms.section1.content')}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Legal Information - Plan2Fund | Company Details & Compliance</title>
        <meta name="description" content="Legal information for Plan2Fund including company details, legal notice, privacy policy, and terms of service in compliance with Austrian and EU law." />
        <meta property="og:title" content={t('legal.ogTitle')} />
        <meta property="og:description" content="Legal information and company details for Plan2Fund in compliance with Austrian and EU regulations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://plan2fund.com/legal" />
        <link rel="canonical" href="https://plan2fund.com/legal" />
      </Head>
      
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <section className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600">
          {t('legal.title')}
        </h1>
        <p className="text-gray-600 mt-2">Transparency and compliance at every step.</p>
      </section>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>


      {/* Tab Content */}
      <div className="prose text-gray-600">
        {renderContent()}
      </div>
      </main>
    </>
  );
}