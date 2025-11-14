import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Menu, X, User, LogOut } from "lucide-react"
import { useRouter } from "next/router"
import LanguageSwitcher from '@/shared/components/layout/LanguageSwitcher'
import { useI18n } from "@/shared/contexts/I18nContext"
import { useUser } from "@/shared/user/context/UserContext"
import LoginModal from '@/shared/components/auth/LoginModal'

export default function Header() {
  const { t } = useI18n()
  const router = useRouter()
  const { userProfile, clearUserProfile } = useUser()
  const [open, setOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = () => {
    clearUserProfile()
    setOpen(false)
    router.push('/')
  }

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  // Focus management for mobile menu
  useEffect(() => {
    if (open && menuRef.current) {
      const firstLink = menuRef.current.querySelector('a') as HTMLElement
      firstLink?.focus()
    }
  }, [open])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Plan2Fund
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            {t('nav.howItWorks')}
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            {t('nav.pricing')}
          </Link>
          <Link href="/faq" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            FAQ
          </Link>
          {isMounted && userProfile ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                My Account
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : isMounted ? (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-medium"
            >
              Log in
            </button>
          ) : (
            <div className="w-20 h-10" />
          )}
          <LanguageSwitcher />
        </nav>

        {/* Mobile Menu Button */}
        <button 
          ref={buttonRef}
          className="md:hidden p-2 hover:bg-surfaceAlt rounded-lg transition-colors touch-target" 
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div id="mobile-menu" ref={menuRef} className="md:hidden border-t bg-white/95 backdrop-blur-md">
          <div className="px-4 py-6 flex flex-col gap-4">
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              onClick={() => setOpen(false)}
            >
              {t('nav.howItWorks')}
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              onClick={() => setOpen(false)}
            >
              {t('nav.pricing')}
            </Link>
            <Link 
              href="/faq" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              onClick={() => setOpen(false)}
            >
              {t('nav.faq')}
            </Link>
            {isMounted && userProfile ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
                  onClick={() => setOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {t('nav.myAccount')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium py-2 text-left w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            ) : isMounted ? (
              <button
                onClick={() => {
                  setLoginModalOpen(true);
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-medium text-center"
              >
                Log in
              </button>
            ) : null}
            <div className="pt-4 border-t">
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        redirect={router.asPath !== '/' ? router.asPath : undefined}
      />
    </header>
  )
}

