import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Menu, X, User, LogOut } from "lucide-react"
import { useRouter } from "next/router"
import LanguageSwitcher from '@/shared/components/layout/LanguageSwitcher'
import { useI18n } from "@/shared/contexts/I18nContext"
import { useUser } from "@/shared/user/context/UserContext"
import LoginModal from '@/shared/components/auth/LoginModal'

import EditorHeader from '@/shared/components/layout/EditorHeader';

export default function Header() {
  const { t } = useI18n()
  const router = useRouter()
  const { userProfile, clearUserProfile } = useUser()
  const [open, setOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Check if we're on the editor page
  const isEditorPage = router.pathname === '/app/user/editor';

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
    <header className="sticky top-0 z-50 w-full border-b-2 border-neutral-200 bg-white/95 backdrop-blur-md shadow-md">
      {isEditorPage ? (
        <EditorHeader />
      ) : (
        // Regular header for other pages
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-neutral-700 to-neutral-900 bg-clip-text text-transparent hover:from-neutral-800 hover:to-neutral-900 transition-all duration-300"
          >
            Plan2Fund
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="/marketing/about" className="text-neutral-700 hover:text-neutral-900 transition-colors font-semibold text-sm uppercase tracking-wide">
              {t('nav.howItWorks')}
            </Link>
            <Link href="/checkout/pricing" className="text-neutral-700 hover:text-neutral-900 transition-colors font-semibold text-sm uppercase tracking-wide">
              {t('nav.pricing')}
            </Link>
            <Link href="/marketing/faq" className="text-neutral-700 hover:text-neutral-900 transition-colors font-semibold text-sm uppercase tracking-wide">
              FAQ
            </Link>
            {isMounted && userProfile ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/app/user/dashboard" 
                  className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 transition-colors font-semibold text-sm"
                >
                  <User className="w-4 h-4" />
                  My Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 transition-colors font-semibold text-sm"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </div>
            ) : isMounted ? (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-6 py-2.5 border-2 border-blue-600 text-blue-700 bg-white rounded-xl hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
      )}

      {/* Mobile Nav */}
      {open && (
        <div id="mobile-menu" ref={menuRef} className="md:hidden border-t-2 border-neutral-200 bg-white/95 backdrop-blur-md shadow-lg">
          <div className="px-4 py-6 flex flex-col gap-4">
            <Link 
              href="/marketing/about" 
              className="text-neutral-700 hover:text-neutral-900 transition-colors font-semibold py-3 text-sm uppercase tracking-wide"
              onClick={() => setOpen(false)}
            >
              {t('nav.howItWorks')}
            </Link>
            <Link 
              href="/checkout/pricing" 
              className="text-neutral-700 hover:text-neutral-900 transition-colors font-semibold py-3 text-sm uppercase tracking-wide"
              onClick={() => setOpen(false)}
            >
              {t('nav.pricing')}
            </Link>
            <Link 
              href="/marketing/faq" 
              className="text-neutral-700 hover:text-neutral-900 transition-colors font-semibold py-3 text-sm uppercase tracking-wide"
              onClick={() => setOpen(false)}
            >
              {t('nav.faq')}
            </Link>
            {isMounted && userProfile ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-neutral-700 hover:text-blue-600 transition-colors font-semibold py-3"
                  onClick={() => setOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {t('nav.myAccount')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-neutral-700 hover:text-blue-600 transition-colors font-semibold py-3 text-left w-full"
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
                className="w-full px-4 py-3 text-blue-700 border-2 border-blue-600 bg-white rounded-xl hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all duration-300 font-semibold text-center shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                Log in
              </button>
            ) : null}
            <div className="pt-4 border-t border-neutral-200">
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

