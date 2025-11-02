export type AddOn = 'one_pager' | 'submission_pack'

// Legacy stub: add-ons are generated in export page; this keeps API compatibility
export function generateAddOn(addOn: AddOn, plan: any): { filename: string; html: string } {
  if (addOn === 'one_pager') {
    const html = `<h1>${plan?.title || 'One Pager'}</h1><p>${(plan?.summary || '').slice(0, 800)}</p>`
    return { filename: 'one-pager.html', html }
  }
  const html = `<h1>Submission Pack</h1><ul><li>Checklist</li><li>Annex guidance</li></ul>`
  return { filename: 'submission-pack.html', html }
}



