import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"
import LanguageSwitcher from "@/components/layout/LanguageSwitcher"

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600 hover:opacity-80">
          Plan2Fund
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/about" className="hover:text-blue-600">About</Link>
          <Link href="/pricing" className="hover:text-blue-600">Pricing</Link>
          <Link href="/contact" className="hover:text-blue-600">Contact</Link>
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          {/* Language Switcher */}
          <LanguageSwitcher />
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3">
          <Link href="/about" className="hover:text-blue-600">About</Link>
          <Link href="/pricing" className="hover:text-blue-600">Pricing</Link>
          <Link href="/contact" className="hover:text-blue-600">Contact</Link>
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <div className="w-max"><LanguageSwitcher compact /></div>
        </div>
      )}
    </header>
  )
}

