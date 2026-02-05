import type { PlanSection } from '../../../../../types/types';

/**
 * SIMPLE STRUCTURAL SECTION EXTRACTION
 * - detects numbered + short headings only
 * - no domain guessing
 * - no business-plan assumptions
 */

export function extractSectionsFromFileContent(
  content: string,
  fileName: string
): PlanSection[] {

  const lines = content.split('\n');
  const sections: PlanSection[] = [];

  let current: { title: string; content: string } | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const isNumbered = /^\d+(\.\d+)*\s+/.test(line);
    const isShortTitle =
      line.length < 80 &&
      line.split(/\s+/).length <= 8 &&
      /^[A-ZÄÖÜ]/.test(line);

    if (isNumbered || isShortTitle) {
      if (current) sections.push(createSection(current));
      current = { title: cleanTitle(line), content: '' };
      continue;
    }

    if (!current) {
      current = {
        title: fileName.replace(/\.[^/.]+$/, '') || 'Document',
        content: ''
      };
    }

    current.content += (current.content ? '\n' : '') + line;
  }

  if (current) sections.push(createSection(current));

  if (sections.length === 0) {
    sections.push(
      createSection({
        title: fileName.replace(/\.[^/.]+$/, '') || 'Document',
        content
      })
    );
  }

  return sections;
}

/* ---------------------------------------------------- */

function cleanTitle(line: string) {
  return line
    .replace(/^\d+(\.\d+)*\s*/, '')
    .replace(/:$/, '')
    .trim();
}

function createSection(data: { title: string; content: string }): PlanSection {
  const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

  return {
    key: id,
    id,
    title: data.title,
    content: data.content,
    rawSubsections: [
      {
        id: `${id}-raw`,
        title: data.title,
        rawText: data.content
      }
    ]
  };
}
