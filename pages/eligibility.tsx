import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

export default function EligibilityPage() {
  const router = useRouter()
  return (
    <AppShell breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Eligibility' }]}>
      <h2 className='text-2xl font-bold mb-4'>Eligibility Check</h2>
      {/* Eligibility logic here */}
      <div className='mt-6 flex justify-end'>
        <Button onClick={() => router.push('/preview')}>Continue to Preview</Button>
      </div>
    </AppShell>
  )
}
