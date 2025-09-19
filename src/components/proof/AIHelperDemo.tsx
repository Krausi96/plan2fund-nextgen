import React, { useState } from 'react';
import { aiHelperGuardrails } from '../../legacy/_quarantine/aiHelperGuardrails';

export default function AIHelperDemo() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await aiHelperGuardrails.processInput(input);
    setResponse(result);
    
    // Get metrics
    const metricsData = aiHelperGuardrails.getMetrics();
    setMetrics(metricsData);
  };

  const testCases = [
    {
      name: 'AI → Chips',
      input: 'I need funding for my tech startup in Vienna, we are 3 people looking for €50k grant',
      description: 'Should extract: sector, stage, team, location, amount'
    },
    {
      name: 'Off-topic Redirect',
      input: 'write me a poem about funding',
      description: 'Should redirect to wizard'
    },
    {
      name: 'Unknown Program → Suggestion Ticket',
      input: 'I need funding from the Austrian Innovation Fund program',
      description: 'Should create suggestion ticket with URL'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Helper Guardrails Demo</h1>
      
      {/* Test Cases */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Cases</h2>
        <div className="space-y-2">
          {testCases.map((testCase, idx) => (
            <button
              key={idx}
              onClick={() => setInput(testCase.input)}
              className="block w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
            >
              <div className="font-medium">{testCase.name}</div>
              <div className="text-sm text-gray-600">{testCase.description}</div>
              <div className="text-sm text-blue-600 mt-1">"{testCase.input}"</div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Input:
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Enter your test input here..."
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Process Input
        </button>
      </form>

      {/* Response */}
      {response && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">AI Helper Response:</h3>
          <div className="space-y-2">
            <div><strong>Type:</strong> {response.type}</div>
            <div><strong>Confidence:</strong> {Math.round(response.confidence * 100)}%</div>
            <div><strong>Guardrails:</strong></div>
            <ul className="ml-4 space-y-1">
              <li>Program Invented: {response.guardrails.programInvented ? '❌' : '✅'}</li>
              <li>Off-topic: {response.guardrails.offTopic ? '❌' : '✅'}</li>
              <li>Unknown Program: {response.guardrails.unknownProgram ? '❌' : '✅'}</li>
              <li>Within Scope: {response.guardrails.withinScope ? '✅' : '❌'}</li>
            </ul>
            
            {response.type === 'chips' && (
              <div className="mt-3">
                <strong>Extracted Chips:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {response.content.map((chip, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {chip.label}: {chip.value} ({Math.round(chip.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {response.type === 'redirect' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <strong>Redirect Message:</strong> {response.content.message}
              </div>
            )}
            
            {response.type === 'suggestion_ticket' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <strong>Suggestion Ticket Created:</strong>
                <div className="mt-2 text-sm">
                  <div>ID: {response.content.id}</div>
                  <div>Program: {response.content.programName}</div>
                  <div>URLs: {response.content.urls.join(', ')}</div>
                  <div>Reason: {response.content.reason}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">Tiny Metrics Snapshot:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>AI Help Opened: {metrics.totalRequests}</div>
            <div>Chips Generated: {metrics.chipsGenerated}</div>
            <div>Clarifications Asked: {metrics.clarificationsProvided}</div>
            <div>Off-topic Redirects: {metrics.redirectsIssued}</div>
            <div>Suggestion Tickets: {metrics.suggestionTicketsCreated}</div>
            <div>Avg Confidence: {Math.round(metrics.averageConfidence * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
