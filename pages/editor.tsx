// ========= PLAN2FUND — SIMPLE EDITOR PAGE =========
// Clean, intuitive editor page with proper error handling

import { useRouter } from 'next/router';
import SimpleEditor from '../components/editor/SimpleEditor';

export default function EditorPage() {
  const router = useRouter();
  const { programId, route, product, answers } = router.query;

  // Show loading while router is ready
  if (!router.isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <SimpleEditor
      programId={programId as string}
      route={route as string}
      product={product as string}
      answers={answers ? JSON.parse(decodeURIComponent(answers as string)) : undefined}
    />
  );
}