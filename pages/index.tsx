import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <AppShell>
      <section className='text-center py-20'>
        <h1 className='text-4xl font-bold mb-6'>Welcome to Plan2Fund NextGen</h1>
        <p className='mb-8 text-gray-600'>Your journey to funding success starts here.</p>
        <div className='flex justify-center gap-4'>
          <Link href='/reco'><Button>Get Recommendations</Button></Link>
          <Link href='/plan'><Button variant='outline'>Build Your Plan</Button></Link>
        </div>
      </section>
    </AppShell>
  )
}
