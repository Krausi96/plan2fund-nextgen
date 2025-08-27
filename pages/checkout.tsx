import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'

export default function CheckoutPage() {
  const router = useRouter()
  return (
    <AppShell breadcrumb={['Home','Checkout']}>
      <h2 className='text-2xl font-bold mb-4'>Checkout</h2>
      {/* Checkout components here */}
      <div className='mt-6 flex justify-end'>
        <Button onClick={() => router.push('/export')}>Export Plan</Button>
      </div>
    </AppShell>
  )
}
