import { useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@/shared/contexts/UserContext'
import SEOHead from '@/shared/components/common/SEOHead'
import emailService from '@/shared/lib/emailService'

export default function LoginPage() {
  const router = useRouter()
  const { setUserProfile, userProfile, isLoading } = useUser()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [segment, setSegment] = useState<'B2C_FOUNDER' | 'SME_LOAN' | 'VISA' | 'PARTNER'>('B2C_FOUNDER')
  const [loading, setLoading] = useState(false)

  // Get redirect parameter from query string
  const { redirect } = router.query

  // Wait for user context to load before checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is already logged in, redirect them
  if (userProfile) {
    const destination = redirect ? decodeURIComponent(redirect as string) : '/dashboard'
    router.replace(destination)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const id = email.toLowerCase()
      setUserProfile({
        id,
        segment,
        programType: 'GRANT',
        industry: 'GENERAL',
        language: 'EN',
        payerType: 'INDIVIDUAL',
        experience: 'NEWBIE',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        gdprConsent: true
      })
      // Send welcome email (non-blocking)
      if (email) {
        emailService.sendWelcomeEmail(email, name || undefined).catch(err => {
          console.error('Failed to send welcome email:', err);
        });
      }
      
      // Redirect to intended destination or dashboard
      const destination = redirect ? decodeURIComponent(redirect as string) : '/dashboard'
      router.replace(destination)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEOHead pageKey="login" />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-xl border">
          <h1 className="text-2xl font-bold mb-4">Log in</h1>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2 mb-3" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2 mb-3" value={name} onChange={e=>setName(e.target.value)} />
          <label className="block text-sm font-medium text-gray-700 mb-1">Segment</label>
          <select className="w-full border rounded px-3 py-2 mb-4" value={segment} onChange={e=>setSegment(e.target.value as any)}>
            <option value="B2C_FOUNDER">B2C Founder</option>
            <option value="SME_LOAN">SME / Loan</option>
            <option value="VISA">Visa</option>
            <option value="PARTNER">Partner</option>
          </select>
          <button disabled={loading} className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    </>
  )
}


