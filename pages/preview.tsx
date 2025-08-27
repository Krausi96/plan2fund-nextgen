import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

export default function PreviewPage() {
  const router = useRouter()
  return (
    <AppShell breadcrumb={['Home','Preview']}>
      <h2 className='text-2xl font-bold mb-4'>Plan Preview</h2>
      {/* Preview components here */}
      <div className='mt-6 flex justify-end'>
        <Button onClick={() => router.push('/checkout')}>Proceed to Checkout</Button>
      </div>
    </AppShell>
  )
}
