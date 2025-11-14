import React, { useState, useEffect } from 'react';
import SEOHead from '@/shared/components/common/SEOHead';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CTAStrip from '@/shared/components/common/CTAStrip';
import analytics from '@/shared/user/analytics';


export default function Library() {
  const router = useRouter();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load programs from the new categorized data
  useEffect(() => {
    loadPrograms();
    analytics.trackPageView('/library', 'Library');
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/programs?enhanced=true');
      
      if (!response.ok) {
        throw new Error(`Failed to load programs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPrograms(data.programs || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  // Group programs by type
  const programCategories = {
    'Grants': programs.filter(p => p.type?.toLowerCase().includes('grant')),
    'Loans': programs.filter(p => p.type?.toLowerCase().includes('loan')),
    'Investments': programs.filter(p => p.type?.toLowerCase().includes('investment') || p.type?.toLowerCase().includes('equity')),
    'Visa Programs': programs.filter(p => p.type?.toLowerCase().includes('visa') || p.type?.toLowerCase().includes('residency'))
  };

  return (
    <>
      <SEOHead pageKey="library" schema="faq" />
      
      <main className="bg-gray-50 min-h-screen">
        {/* Header */}
        <section className="bg-white py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/pricing" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Pricing</span>
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Program Library
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl">
              Explore all available funding programs. Click on any program to see detailed requirements and start your application.
            </p>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <section className="py-12">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading programs...</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <section className="py-12">
            <div className="max-w-6xl mx-auto px-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={loadPrograms}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Program Categories */}
        {!loading && !error && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="space-y-12">
                {Object.entries(programCategories).map(([categoryName, categoryPrograms]) => (
                <div key={categoryName}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                      {categoryName} ({categoryPrograms.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryPrograms.map((program) => (
                        <div
                          key={program.id}
                          className="text-left p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {program.name}
                            </h3>
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          </div>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            {program.description || 'Austrian funding program'}
                          </p>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            {program.amount && (
                              <p>
                                <span className="font-semibold text-gray-800">Funding:</span> {program.amount}
                              </p>
                            )}
                            {program.deadlines?.length ? (
                              <p>
                                <span className="font-semibold text-gray-800">Upcoming deadline:</span> {program.deadlines[0]}
                              </p>
                            ) : (
                              <p className="text-gray-500">Detailed requirements coming soon.</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <button
                              onClick={() => router.push(`/editor?programId=${program.id}&route=${program.type?.toLowerCase() || 'grant'}&product=submission`)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                            >
                              Open in Editor
                            </button>
                            <button
                              onClick={() => router.push(`/reco?programId=${program.id}`)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                            >
                              View Recommendations
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* General CTAs */}
        <CTAStrip
          title="Ready to Create Your Business Plan?"
          subtitle="Browse programs above or start directly with our business plan editor."
          primaryAction={{
            label: "Get Recommendations",
            href: "/reco"
          }}
          secondaryAction={{
            label: "Start Editor",
            href: "/editor"
          }}
        />

      </main>
    </>
  );
}
