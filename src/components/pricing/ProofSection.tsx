// ========= PLAN2FUND — SNAPSHOTS (TESTIMONIALS) =========
// Customer snapshots replacing the previous proof/benefits section

import React from 'react';

export function ProofSection() {
  const snapshots = [
    {
      initials: 'AK',
      name: 'Anna K.',
      role: 'Founder, Healthtech',
      quote: 'Matched to 3 grants in one session and turned the draft into a submission‑ready plan the same week.'
    },
    {
      initials: 'MS',
      name: 'Mark S.',
      role: 'SME, Manufacturing',
      quote: 'Bank summary and DSCR checks made the loan meeting straightforward. We got quick approval.'
    },
    {
      initials: 'RL',
      name: 'Rita L.',
      role: 'Researcher, University lab',
      quote: 'Horizon structure and annex checklist removed guesswork. We focused on the science instead of formatting.'
    },
    {
      initials: 'TA',
      name: 'Tom A.',
      role: 'Non‑EU Founder',
      quote: 'Visa plan and evidence checklist clarified exactly what to prepare. No round‑trips on documents.'
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Snapshots</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Real outcomes from founders using Plan2Fund — short looks at how plans turned into funding.
          </p>
        </div>

        {/* Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {snapshots.map((s, i) => (
            <figure key={i} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {s.initials}
                </div>
                <div>
                  <figcaption className="font-semibold text-gray-900">{s.name}</figcaption>
                  <div className="text-sm text-gray-600">{s.role}</div>
                </div>
              </div>
              <blockquote className="mt-4 text-gray-800">“{s.quote}”</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
