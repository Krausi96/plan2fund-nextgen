import Link from "next/link"
import { useState, useEffect } from "react"
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/router"
import LanguageSwitcher from "@/shared/components/layout/LanguageSwitcher"
import { useUser } from "@/shared/user/context/UserContext"
import LoginModal from '@/shared/components/auth/LoginModal'
import CurrentSelection from '@/features/editor/components/Navigation/CurrentSelection'

export default function EditorHeader() {
  const router = useRouter()
  const { userProfile, clearUserProfile } = useUser()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = () => {
    clearUserProfile()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Blue gradient background - seamless with workspace */}
      <div className="w-full bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 px-4 py-0">
        <div className="mx-auto" style={{ maxWidth: '1800px', padding: '0.75rem 0' }}>
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="text-2xl md:text-3xl font-bold text-white hover:text-white/90 transition-all duration-300"
              >
                Plan2Fund
              </Link>
            </div>
            
            {/* Center: CurrentSelection - perfectly centered */}
            <div className="flex-grow flex justify-center px-6">
              <div className="w-full max-w-6xl">
                <CurrentSelection />
              </div>
            </div>
            
            {/* Right: Auth + Language controls */}
            <div className="flex items-center gap-3">
              {isMounted && userProfile ? (
                <div className="flex items-center gap-2">
                  <Link 
                    href="/app/user/dashboard" 
                    className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">My Account</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Log out</span>
                  </button>
                </div>
              ) : isMounted ? (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="px-5 py-2.5 border-blue-600 text-white bg-blue-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-700 font-semibold tracking-wide text-sm whitespace-nowrap"
                >
                  Log in
                </button>
              ) : (
                <div className="w-16 h-6" />
              )}
              <div className="text-white">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        redirect={router.asPath !== '/' ? router.asPath : undefined}
      />
    </header>
  );
}