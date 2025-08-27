import AppShell from '@/components/layout/AppShell'

export default function ThanksPage() {
  return (
    <AppShell breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Thank You' }]}>
      <h2 className='text-2xl font-bold mb-4'>Thank You!</h2>
      <p>Your business plan has been created and exported successfully.</p>
    </AppShell>
  )
}
