import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Editor from "@/components/plan/Editor";
import { decodePayload, validatePayload } from "@/lib/payload";

export default function EditorPage() {
  const router = useRouter();
  const [program, setProgram] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get program data and answers from URL params or localStorage
    const { programId, answers, pf } = router.query;
    
    if (programId) {
      // Load program data from localStorage or API
      const savedProgram = localStorage.getItem(`program_${programId}`) || 
                          localStorage.getItem('selectedProgram');
      if (savedProgram) {
        setProgram(JSON.parse(savedProgram));
      }
    }
    
    // Try to load enhanced payload first
    if (pf) {
      try {
        const payload = decodePayload(pf as string);
        if (payload && validatePayload(payload)) {
          setUserAnswers(payload.answers_v1);
          if (payload.program) {
            setProgram(payload.program);
          }
          // Store enhanced payload for Editor component
          localStorage.setItem('enhancedPayload', JSON.stringify(payload));
        } else {
          console.error('Invalid payload structure');
        }
      } catch (e) {
        console.error('Failed to parse enhanced payload:', e);
      }
    } else if (answers) {
      try {
        setUserAnswers(JSON.parse(decodeURIComponent(answers as string)));
      } catch (e) {
        console.error('Failed to parse answers:', e);
      }
    } else {
      // Fallback to localStorage
      const savedAnswers = localStorage.getItem('userAnswers');
      if (savedAnswers) {
        setUserAnswers(JSON.parse(savedAnswers));
      }
    }
    
    setLoading(false);
  }, [router.query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return <Editor program={program} userAnswers={userAnswers} showProductSelector={!program && !userAnswers} />;
}
