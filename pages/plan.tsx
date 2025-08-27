import AppShell from '@/components/layout/AppShell'
import Editor from '@/components/plan/Editor'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

export default function PlanPage() {
  const router = useRouter()
  return (
    <AppShell breadcrumb={['Home','Plan']}>
      <Editor />
      <div className='mt-6 flex justify-end'>
        <Button onClick={() => router.push('/eligibility')}>Continue</Button>
      </div>
    </AppShell>
  )
}
