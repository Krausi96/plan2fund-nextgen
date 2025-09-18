import { useEffect, useState } from 'react';
import questionsData from '@/data/questions';
import programsData from '@/data/programs';

export default function TestDataPage() {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    try {
      console.log('Questions data:', questionsData);
      console.log('Programs data:', programsData);
      
      if (questionsData && questionsData.universal && questionsData.universal.length > 0) {
        setStatus('✅ Data loaded successfully!');
      } else {
        setStatus('❌ Questions data is empty or invalid');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Data Loading Test</h1>
      <p className="text-lg mb-4">Status: {status}</p>
      
      {questionsData && questionsData.universal && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Questions Data:</h2>
          <p>Number of questions: {questionsData.universal.length}</p>
          <p>First question: {questionsData.universal[0]?.label}</p>
        </div>
      )}
      
      {programsData && programsData.programs && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Programs Data:</h2>
          <p>Number of programs: {programsData.programs.length}</p>
          <p>First program: {programsData.programs[0]?.name}</p>
        </div>
      )}
    </div>
  );
}
