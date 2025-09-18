// Data loader utility for static export
let programsCache: any[] | null = null;
let questionsCache: any | null = null;

export async function loadPrograms(): Promise<any[]> {
  if (programsCache) {
    return programsCache;
  }
  
  try {
    const response = await fetch('/api/data/programs');
    const data = await response.json();
    programsCache = data.programs || [];
    return data.programs || [];
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
    const response = await fetch('/api/data/questions');
    const data = await response.json();
    questionsCache = data;
    return data;
  } catch (error) {
    console.error('Error loading questions:', error);
    return { universal: [], core: [], micro: [] };
  }
}

export function clearCache() {
  programsCache = null;
  questionsCache = null;
}
