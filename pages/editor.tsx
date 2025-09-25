import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import UnifiedEditor from "@/components/editor/UnifiedEditor";
import { decodePayload, validatePayload } from "@/lib/payload";
import { useI18n } from "@/contexts/I18nContext";

export default function EditorPage() {
  const { t } = useI18n();
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
          <title>{t('editor.loading.title')}</title>
          <meta name="description" content={t('editor.loading.description')} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('editor.loading.text')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('editor.title')}</title>
        <meta name="description" content={t('editor.description')} />
        <meta name="keywords" content={t('editor.keywords')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={t('editor.ogTitle')} />
        <meta property="og:description" content={t('editor.ogDescription')} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('editor.ogTitle')} />
        <meta name="twitter:description" content={t('editor.ogDescription')} />
        <link rel="canonical" href="https://plan2fund.com/editor" />
      </Head>
      <UnifiedEditor program={program} userAnswers={userAnswers} showProductSelector={!program && !userAnswers} />
    </>
  );
}
