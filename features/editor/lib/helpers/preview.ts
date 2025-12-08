// Utility functions for PreviewWorkspace component
// Converts editor sections to preview document format

import type { Section, PlanSection } from '@/features/editor/lib/types/plan';

/**
 * Converts an editor Section to a PlanSection for preview rendering
 */
export function convertSectionToPlanSection(section: Section, sectionNumber: number | null): PlanSection {
  const htmlParts: string[] = [];
  
  if (section.description) {
    htmlParts.push('<div class="section-header">');
    htmlParts.push(`<p class="section-summary">${section.description}</p>`);
    htmlParts.push('</div>');
  }

  let hasContent = false;
  let subchapterIndex = 0;
  const subchapters: Array<{ id: string; title: string; numberLabel: string }> = [];
  
  section.questions.forEach((question) => {
    if (question.answer && question.answer.trim()) {
      hasContent = true;
      // Only number subchapters if section has a number (exclude Executive Summary)
      if (sectionNumber !== null) {
        subchapterIndex += 1;
        const subchapterLabel = `${sectionNumber}.${subchapterIndex}`;
        
        htmlParts.push(
          `<h4 class="section-subchapter" data-question-id="${question.id}">${subchapterLabel} ${question.prompt}</h4>`
        );
        
        subchapters.push({
          id: question.id,
          title: question.prompt,
          numberLabel: subchapterLabel
        });
      } else {
        // Executive Summary or unnumbered sections - no numbering
        htmlParts.push(
          `<h4 class="section-subchapter" data-question-id="${question.id}">${question.prompt}</h4>`
        );
        
        subchapters.push({
          id: question.id,
          title: question.prompt,
          numberLabel: ''
        });
      }
      
      const normalizedAnswer = question.answer
        .replace(/\*\*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const paragraphs = normalizedAnswer.split(/\n{2,}/).map((paragraph) => paragraph.trim());
      const paragraphHtml = paragraphs
        .map((paragraph) => {
          const sanitized = paragraph.replace(/\n/g, '<br />');
          return `<p>${sanitized}</p>`;
        })
        .join('');

      htmlParts.push(`<div class="section-answer" data-question-id="${question.id}" data-question-content="true">${paragraphHtml}</div>`);
    }
  });

  const hasRealContent = hasContent;

  // Determine display title with section number
  const displayTitle = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;

  return {
    key: section.id,
    title: section.title,
    content: htmlParts.join(''),
    fields: {
      sectionNumber: sectionNumber,
      displayTitle: displayTitle,
      subchapters: subchapters,
      hasRealContent,
      attachments: [],
      tableMetadata: {}
    },
    tables: {},
    figures: section.media?.map((media) => ({
      id: media.id,
      type: media.type,
      title: media.title,
      uri: media.uri,
      caption: media.caption,
      altText: media.altText,
      description: media.description,
      source: media.source,
      tags: media.tags
    })),
    status: section.progress === 100 ? 'aligned' : section.progress && section.progress > 0 ? 'needs_fix' : 'missing'
  };
}

