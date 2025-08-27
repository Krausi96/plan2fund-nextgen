import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

export default function ExportPage() {
  const router = useRouter()
  return (
    <AppShell breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Export' }]}>
      <h2 className='text-2xl font-bold mb-4'>Export Plan</h2>
      {/* Export panel here */}
      <div className='mt-6 flex justify-end'>
        <Button onClick={() => router.push('/thanks')}>Finish</Button>
      </div>
    
  )
}

