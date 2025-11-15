import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@/shared/user/context/UserContext'
import SEOHead from '@/shared/components/common/SEOHead'
import LoginModal from '@/shared/components/auth/LoginModal'

export default function LoginPage() {
  const router = useRouter()
  const { userProfile, isLoading } = useUser()
  const [showModal, setShowModal] = useState(false)

  // Get redirect parameter from query string
  const { redirect } = router.query

  useEffect(() => {
    // Show modal when page loads
    if (!isLoading) {
      setShowModal(true)
    }
  }, [isLoading])

  // If user is already logged in, redirect them
  useEffect(() => {
    if (userProfile) {
      const destination = redirect ? decodeURIComponent(redirect as string) : '/dashboard'
      router.replace(destination)
    }
  }, [userProfile, redirect, router])

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
      <LoginModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false)
          // Redirect to home if modal is closed without login
          router.push('/')
        }}
        redirect={redirect ? decodeURIComponent(redirect as string) : '/dashboard'}
      />
    </>
  )
}


