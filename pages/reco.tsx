import { useRouter } from 'next/router'
import AppShell from '@/components/layout/AppShell'
import Wizard from '@/components/reco/Wizard'
import { Button } from '@/components/ui/button'

export default function RecoPage() {
  const router = useRouter()
  return (
    <AppShell breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Recommendations' }]}>
      <Wizard />
      <div className='mt-6 flex justify-end'>
        <Button onClick={() => router.push('/results')}>See Results</Button>
      </div>
    </AppShell>
  )
}
