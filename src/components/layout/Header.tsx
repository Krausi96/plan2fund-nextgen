import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Menu, X, User } from "lucide-react"
import LanguageSwitcher from "@/components/layout/LanguageSwitcher"
import { useI18n } from "@/contexts/I18nContext"
import { useUser } from "@/contexts/UserContext"

export default function Header() {
  const { t } = useI18n()
  const { userProfile } = useUser()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          Plan2Fund
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link href="/about" className="text-textSecondary hover:text-primary transition-colors font-medium">
            {t('nav.howItWorks')}
          </Link>
          <Link href="/advanced-search" className="text-textSecondary hover:text-primary transition-colors font-medium">
            Advanced Search
          </Link>
          <Link href="/pricing" className="text-textSecondary hover:text-primary transition-colors font-medium">
            {t('nav.pricing')}
          </Link>
          <Link href="/faq" className="text-textSecondary hover:text-primary transition-colors font-medium">
            FAQ
          </Link>
          {userProfile ? (
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-textSecondary hover:text-primary transition-colors font-medium"
            >
              <User className="w-4 h-4" />
              My Account
            </Link>
          ) : null}
          <Link 
            href="/editor" 
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover transition-colors font-medium shadow-md hover:shadow-lg"
          >
            {t('nav.startPlan')}
          </Link>
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
              href="/advanced-search" 
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
              onClick={() => setOpen(false)}
            >
              Advanced Search
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
              FAQ
            </Link>
            {userProfile ? (
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
                onClick={() => setOpen(false)}
              >
                <User className="w-4 h-4" />
                My Account
              </Link>
            ) : null}
            <Link 
              href="/editor" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center mt-2 shadow-md hover:shadow-lg"
              onClick={() => setOpen(false)}
            >
              {t('nav.startPlan')}
            </Link>
            <div className="pt-4 border-t">
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

