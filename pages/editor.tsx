import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import UnifiedEditor from "@/components/editor/UnifiedEditor";
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
      <>
        <Head>
          <title>Loading Editor - Plan2Fund</title>
          <meta name="description" content="Loading your business plan editor..." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading editor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Business Plan Editor - Plan2Fund</title>
        <meta name="description" content="Create professional business plans with AI assistance. Block-based editor with program-specific guidance and funding recommendations." />
        <meta name="keywords" content="business plan, editor, funding, AI assistance, startup, entrepreneur" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Business Plan Editor - Plan2Fund" />
        <meta property="og:description" content="Create professional business plans with AI assistance and program-specific guidance." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Business Plan Editor - Plan2Fund" />
        <meta name="twitter:description" content="Create professional business plans with AI assistance and program-specific guidance." />
        <link rel="canonical" href="https://plan2fund.com/editor" />
      </Head>
      <UnifiedEditor program={program} userAnswers={userAnswers} showProductSelector={!program && !userAnswers} />
    </>
  );
}
