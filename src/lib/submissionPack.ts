export type SubmissionPackPart = 'one_pager' | 'submission_pack'

// Legacy stub: submission pack is now generated in pages/export.tsx
export function buildSubmissionPackHtml(type: SubmissionPackPart, data: any): string {
  if (type === 'one_pager') {
    return `<h1>One Pager</h1><p>${(data?.summary || '').slice(0, 500)}</p>`
  }
  return `<h1>Submission Pack</h1><p>Checklist and brief.</p>`
}



