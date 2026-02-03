import React, { useState } from 'react';
import { useEditorStore, useConfiguratorState } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import { simulateTemplateUpload } from './TemplateUploadSimulation';
import { simulateRecoWizard } from './RecoWizardSimulation';
import { simulateUrlParsing } from './UrlParsingSimulation';
import { simulateFreeOption } from './FreeOptionSimulation';

type SimulationType = 'templateUpload' | 'recoWizard' | 'urlParsing' | 'freeOption';

interface SimulationResult {
  type: SimulationType;
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  timestamp: Date;
  details?: any;
}

export function FlowSimulator() {
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationType>('templateUpload');
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Access editor store actions for simulation
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  
  // Access configurator state for updating program summary
  const configuratorActions = useConfiguratorState().actions;
  
  const { t } = useI18n();
  
  const addResult = (result: Omit<SimulationResult, 'timestamp'>) => {
    setResults(prev => [
      {
        ...result,
        timestamp: new Date()
      },
      ...prev.slice(0, 9) // Keep only last 10 results
    ]);
  };

  const runSelectedSimulation = async () => {
    setIsRunning(true);
    
    switch (selectedSimulation) {
      case 'templateUpload':
        await simulateTemplateUpload(
          setDocumentStructure,
          setSetupStatus,
          setSetupDiagnostics,
          configuratorActions,
          addResult,
          t as (key: string) => string
        );
        break;

      case 'recoWizard':
        await simulateRecoWizard(
          setDocumentStructure,
          setSetupStatus,
          setSetupDiagnostics,
          configuratorActions,
          addResult
        );
        break;
      case 'urlParsing':
        await simulateUrlParsing(
          setDocumentStructure,
          setSetupStatus,
          setSetupDiagnostics,
          configuratorActions,
          addResult
        );
        break;
      case 'freeOption':
        await simulateFreeOption(
          setDocumentStructure,
          setSetupStatus,
          setSetupDiagnostics,
          configuratorActions,
          addResult,
          t as (key: string) => string
        );
        break;

      default:
        addResult({ 
          type: selectedSimulation, 
          status: 'error', 
          message: 'Unknown simulation type'
        });
    }
    
    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
  };
  
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600 max-w-4xl">
      <h3 className="text-lg font-bold text-white mb-4">Flow Simulator</h3>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <select 
          value={selectedSimulation}
          onChange={(e) => setSelectedSimulation(e.target.value as SimulationType)}
          className="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="templateUpload">Template Upload</option>
          <option value="recoWizard">Reco Wizard</option>
          <option value="urlParsing">URL Parsing</option>
          <option value="freeOption">Free Option</option>
        </select>
        
        <button 
          onClick={runSelectedSimulation}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Simulation'}
        </button>
        
        <button 
          onClick={clearResults}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Clear Results
        </button>
      </div>
      
      <div className="mb-4">
        <h4 className="text-md font-semibold text-white mb-2">Results:</h4>
        <div className="max-h-60 overflow-y-auto bg-slate-900/50 rounded p-3 border border-slate-700">
          {results.length === 0 ? (
            <p className="text-slate-400 text-sm">No simulation results yet. Run a simulation to see results here.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((result, index) => (
                <li 
                  key={`${result.type}-${result.timestamp.getTime()}-${index}`}
                  className={`p-2 rounded text-sm ${
                    result.status === 'success' ? 'bg-green-900/30 border border-green-700' :
                    result.status === 'error' ? 'bg-red-900/30 border border-red-700' :
                    result.status === 'running' ? 'bg-yellow-900/30 border border-yellow-700' :
                    'bg-slate-700/30 border border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">
                      [{result.type}] {result.message}
                    </span>
                    <span className="text-xs text-slate-400">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {result.details && (
                    <div className="mt-1 text-xs text-slate-300">
                      Details: {JSON.stringify(result.details)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="text-xs text-slate-400">
        <p>This simulator runs complete flows for each option, updating the editor store and showing results.</p>
        <p>Check the store state and other components to see how they respond to each simulation.</p>
      </div>
    </div>
  );
}