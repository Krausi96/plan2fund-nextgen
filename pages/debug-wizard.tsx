// Debug page for SmartWizard QuestionEngine
// Access at: /debug-wizard

import { useState, useEffect } from 'react';
import { QuestionEngine } from '@/features/reco/engine/questionEngine';
import React from 'react';

export default function DebugWizard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [questionEngine, setQuestionEngine] = useState<QuestionEngine | null>(null);
  const [results, setResults] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    async function init() {
      try {
        addLog('📥 Fetching programs...');
        const response = await fetch('/api/programs?enhanced=true');
        const data = await response.json();
        const fetchedPrograms = data.programs || [];
        addLog(`✅ Fetched ${fetchedPrograms.length} programs`);

        addLog('📦 Initializing QuestionEngine...');
        const engine = new QuestionEngine(fetchedPrograms);
        setQuestionEngine(engine);

        const allQuestions = engine.getAllQuestions();
        const coreQuestions = engine.getCoreQuestions();
        const remaining = engine.getRemainingProgramCount();

        addLog(`📊 Total Questions: ${allQuestions.length}`);
        addLog(`📊 Core Questions: ${coreQuestions.length}`);
        addLog(`📊 Remaining Programs: ${remaining}`);

        addLog('\n📋 Questions Generated:');
        allQuestions.forEach((q, idx) => {
          addLog(`  ${idx + 1}. ${q.id} (${q.type}, ${q.options?.length || 0} options, required: ${q.required})`);
        });

        // Check for problems
        if (allQuestions.length === 0) {
          addLog('❌ PROBLEM: No questions generated!');
        } else if (allQuestions.length < 8) {
          addLog(`⚠️ WARNING: Only ${allQuestions.length} questions (expected 8+)`);
        }

        const noOptions = allQuestions.filter(q => !q.options || q.options.length === 0);
        if (noOptions.length > 0) {
          addLog(`❌ PROBLEM: ${noOptions.length} questions have no options:`);
          noOptions.forEach(q => addLog(`  - ${q.id}`));
        }

      } catch (error: any) {
        addLog(`❌ Error: ${error.message}`);
        console.error(error);
      }
    }
    init();
  }, []);

  const simulateFlow = async () => {
    if (!questionEngine) {
      addLog('❌ QuestionEngine not initialized');
      return;
    }

    addLog('\n📝 Starting Question Flow Simulation...');
    addLog('='.repeat(60));

    const answers: Record<string, any> = {};
    let questionNumber = 1;
    const maxQuestions = 15;
    const questionHistory: string[] = [];

    while (questionNumber <= maxQuestions) {
      const nextQuestion = await questionEngine.getNextQuestion(answers);

      if (!nextQuestion) {
        addLog(`\n⏸️ No more questions after ${questionNumber - 1} answers`);
        addLog(`Remaining programs: ${questionEngine.getRemainingProgramCount()}`);
        break;
      }

      if (questionHistory.includes(nextQuestion.id)) {
        addLog(`\n⚠️ Question ${questionNumber}: ${nextQuestion.id} (REPEATED!)`);
      } else {
        addLog(`\nQuestion ${questionNumber}: ${nextQuestion.id}`);
      }
      questionHistory.push(nextQuestion.id);

      const beforeCount = questionEngine.getRemainingProgramCount();
      addLog(`  Programs before: ${beforeCount}`);
      addLog(`  Options: ${nextQuestion.options?.length || 0}`);

      if (!nextQuestion.options || nextQuestion.options.length === 0) {
        addLog(`  ❌ Cannot answer - no options!`);
        break;
      }

      const answer = nextQuestion.options[0].value;
      answers[nextQuestion.id] = answer;
      addLog(`  Answer: ${answer}`);

      const afterCount = questionEngine.getRemainingProgramCount();
      addLog(`  Programs after: ${afterCount} (filtered: ${beforeCount - afterCount})`);

      if (afterCount === 0) {
        addLog(`\n❌ PROBLEM: All programs filtered out after "${nextQuestion.id}"!`);
        break;
      }

      questionNumber++;
    }

    // Final analysis
    const coreQuestionIds = ['location', 'company_type', 'funding_amount', 'use_of_funds', 
      'impact', 'team_size', 'deadline_urgency', 'project_duration'];
    
    const unanswered = coreQuestionIds.filter(id => !answers[id]);
    if (unanswered.length > 0) {
      addLog(`\n⚠️ ${unanswered.length} core questions NOT answered:`);
      unanswered.forEach(id => addLog(`  - ${id}`));
    }

    setResults({
      questionsAsked: questionNumber - 1,
      answers,
      remainingPrograms: questionEngine.getRemainingProgramCount(),
      unansweredCore: unanswered
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">SmartWizard Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <button
            onClick={simulateFlow}
            disabled={!questionEngine}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Simulate Question Flow
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
            {logs.map((log, idx) => (
              <div key={idx} className="mb-1">{log}</div>
            ))}
          </div>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
