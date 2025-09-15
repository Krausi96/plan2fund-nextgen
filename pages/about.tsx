import { Info, FileText, Scale, Eye, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function About() {
  const [activeTab, setActiveTab] = useState<'about' | 'contact'>('about');

  const tabs = [
    { id: 'about', label: 'About Us', content: 'about' },
    { id: 'contact', label: 'Contact', content: 'contact' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-12">
            <motion.div
              className="flex items-start space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Info className="h-8 w-8 text-blue-500" />
              <div>
                <h2 className="text-2xl font-semibold">Our Mission</h2>
                <p className="text-gray-600">
                  We empower entrepreneurs with tools and guidance to build funding-ready business plans.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-start space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <h2 className="text-2xl font-semibold">Our Expertise</h2>
                <p className="text-gray-600">
                  With deep experience in startup funding, we've supported successful applications for grants, visas, and investments.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-start space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Scale className="h-8 w-8 text-purple-500" />
              <div>
                <h2 className="text-2xl font-semibold">Our Values</h2>
                <p className="text-gray-600">
                  Transparency, integrity, and founder-first thinking guide everything we do.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-start space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Eye className="h-8 w-8 text-pink-500" />
              <div>
                <h2 className="text-2xl font-semibold">Our Vision</h2>
                <p className="text-gray-600">
                  To make funding accessible to every entrepreneur, by combining technology with deep expertise.
                </p>
              </div>
            </motion.div>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span>contact@plan2fund.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <span>Vienna, Austria</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-500" />
                    <span>+43 (0) 1 234 5678</span>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
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
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="bg-white">
      <section className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
        <h1 className="text-5xl font-bold mb-4">About Us</h1>
        <p className="text-lg text-gray-600">
          Helping businesses succeed through clear planning and funding expertise.
        </p>
      </section>
      <section className="max-w-3xl mx-auto py-12 px-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
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
      </section>
    </main>
  );
}