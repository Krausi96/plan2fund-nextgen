// Data loader utility for static export
let programsCache: any[] | null = null;
let questionsCache: any | null = null;

export async function loadPrograms(): Promise<any[]> {
  if (programsCache) {
    return programsCache;
  }
  
  try {
    const response = await fetch('/programs.json');
    const data = await response.json();
    programsCache = data;
    return data;
  } catch (error) {
    console.error('Error loading programs:', error);
    return [];
  }
}

export async function loadQuestions(): Promise<any> {
  if (questionsCache) {
    return questionsCache;
  }
  
  try {
    const response = await fetch('/questions.json');
    const data = await response.json();
    questionsCache = data;
    return data;
  } catch (error) {
    console.error('Error loading questions:', error);
    return { core: [], micro: [] };
  }
}

export function clearCache() {
  programsCache = null;
  questionsCache = null;
}
