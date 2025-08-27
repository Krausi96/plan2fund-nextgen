import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

export default function ResultsPage() {
  const router = useRouter()
  return (
    <AppShell breadcrumb={['Home','Results']}>
      <h2 className='text-2xl font-bold mb-4'>Your Recommended Programs</h2>
      {/* Existing results content here */}
      <div className='mt-6 flex justify-end'>
        <Button onClick={() => router.push('/eligibility')}>Check Eligibility</Button>
      </div>
    </AppShell>
  )
}
