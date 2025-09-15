import { useState } from "react";

export default function Legal() {
  const [activeTab, setActiveTab] = useState<'legal' | 'privacy' | 'terms'>('legal');

  const tabs = [
    { id: 'legal', label: 'Legal Notice', content: 'legal' },
    { id: 'privacy', label: 'Privacy Policy', content: 'privacy' },
    { id: 'terms', label: 'Terms & Conditions', content: 'terms' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'legal':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Company Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Company:</strong> Plan2Fund</li>
              <li><strong>Address:</strong> Vienna, Austria</li>
              <li><strong>Email:</strong> contact@plan2fund.com</li>
              <li><strong>VAT ID:</strong> ATUxxxxxxx</li>
            </ul>
          </div>
        );
      case 'privacy':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              In compliance with Austrian and EU law, Plan2Fund provides the following company information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><b>Company Name:</b> Plan2Fund</li>
              <li><b>Business Address:</b> Vienna, Austria</li>
              <li><b>Email:</b> contact@plan2fund.com</li>
              <li><b>VAT ID:</b> [Placeholder VAT Number]</li>
              <li><b>Managing Director:</b> [Your Name Here]</li>
            </ul>
            <p className="text-gray-600 mt-6">
              Dispute resolution: Online dispute resolution platform provided by the European Commission at
              <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 hover:underline"> https://ec.europa.eu/consumers/odr</a>.
            </p>
          </div>
        );
      case 'terms':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Terms & Conditions</h2>
            <p className="text-gray-700 mb-4">
              In compliance with Austrian and EU law, Plan2Fund provides the following company information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><b>Company Name:</b> Plan2Fund</li>
              <li><b>Business Address:</b> Vienna, Austria</li>
              <li><b>Email:</b> contact@plan2fund.com</li>
              <li><b>VAT ID:</b> [Placeholder VAT Number]</li>
              <li><b>Managing Director:</b> [Your Name Here]</li>
            </ul>
            <p className="text-gray-600 mt-6">
              Dispute resolution: Online dispute resolution platform provided by the European Commission at
              <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 hover:underline"> https://ec.europa.eu/consumers/odr</a>.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <section className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Legal Information
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
  );
}