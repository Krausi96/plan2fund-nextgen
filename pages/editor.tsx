import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Editor from "@/components/plan/Editor";

export default function EditorPage() {
  const router = useRouter();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get program data from URL params or localStorage
    const { programId } = router.query;
    
    if (programId) {
      // Load program data from localStorage or API
      const savedProgram = localStorage.getItem(`program_${programId}`);
      if (savedProgram) {
        setProgram(JSON.parse(savedProgram));
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

  return <Editor program={program} />;
}
