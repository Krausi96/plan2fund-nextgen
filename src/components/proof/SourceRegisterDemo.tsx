import React from 'react';

export default function SourceRegisterDemo() {
  const sourceRegister = {
    version: '1.0.0',
    lastUpdated: '2025-01-15T10:30:00Z',
    entries: [
      {
        programId: 'aws_preseed_innovative_solutions',
        programName: 'aws Preseed – Innovative Solutions',
        url: 'https://www.aws.at/en/aws-preseed-innovative-solutions/',
        type: 'HTML',
        extractionMethod: 'manual',
        lastChecked: '2025-01-15',
        hash: 'a1b2c3d4',
        reviewer: 'Sarah Mueller',
        status: 'active',
        nextCheck: '2025-01-22'
      },
      {
        programId: 'ffg_basisprogramm_2025',
        programName: 'FFG Basisprogramm 2025',
        url: 'https://www.ffg.at/en/node/202479',
        type: 'PDF',
        extractionMethod: 'pdf_parser',
        lastChecked: '2025-01-14',
        hash: 'e5f6g7h8',
        reviewer: 'Michael Weber',
        status: 'active',
        nextCheck: '2025-01-21'
      },
      {
        programId: 'eic_accelerator_2025',
        programName: 'EIC Accelerator 2025',
        url: 'https://eic.ec.europa.eu/eic-2025-work-programme_en',
        type: 'HTML',
        extractionMethod: 'scraper',
        lastChecked: '2025-01-13',
        hash: 'i9j0k1l2',
        reviewer: 'Anna Schmidt',
        status: 'stale',
        nextCheck: '2025-01-20'
      }
    ]
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Source Register (Top 20 AT Programs)</h1>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extraction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sourceRegister.entries.map((entry, idx) => (
              <tr key={entry.programId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.programName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  <a href={entry.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {entry.url.length > 50 ? entry.url.substring(0, 50) + '...' : entry.url}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    entry.type === 'HTML' ? 'bg-blue-100 text-blue-800' :
                    entry.type === 'PDF' ? 'bg-red-100 text-red-800' :
                    entry.type === 'FAQ' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.extractionMethod}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.lastChecked}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {entry.hash}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.reviewer}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Merged Data PR Diff</h3>
        <p className="text-sm text-blue-700">
          <strong>PR #123:</strong> Update aws_preseed_innovative_solutions rule decisiveness from SOFT to HARD
          <br />
          <strong>Tree Regeneration:</strong> "tree rebuilt from programs@a1b2c3d4e5f6"
          <br />
          <strong>Human Reviewer:</strong> Sarah Mueller (Data Team Lead)
        </p>
      </div>
    </div>
  );
}
