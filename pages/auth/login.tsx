import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@/shared/user/context/UserContext'
import SEOHead from '@/shared/components/common/SEOHead'
import LoginForm from '@/shared/components/auth/LoginForm'

export default function LoginPage() {
  const router = useRouter()
  const { userProfile, isLoading } = useUser()

  // Get redirect parameter from query string
  const { redirect } = router.query

  // If user is already logged in, redirect them
  useEffect(() => {
    if (!isLoading && userProfile) {
      const destination = redirect ? decodeURIComponent(redirect as string) : '/dashboard'
      router.replace(destination)
    }
  }, [userProfile, isLoading, redirect, router])

  // Wait for user context to load
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

  // If already logged in, don't render
  if (userProfile) {
    return null
  }

  return (
    <>
      <SEOHead pageKey="login" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <LoginForm 
            redirect={redirect ? decodeURIComponent(redirect as string) : '/dashboard'}
          />
        </div>
      </div>
    </>
  )
}


