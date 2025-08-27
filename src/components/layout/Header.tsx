import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"

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
          {/* Language Switcher */}
          <select className="border rounded px-2 py-1 text-sm">
            <option value="en">🇬🇧 EN</option>
            <option value="de">🇩🇪 DE</option>
            <option value="es">🇪🇸 ES</option>
            <option value="fr">🇫🇷 FR</option>
          </select>
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
          <select className="border rounded px-2 py-1 text-sm w-max">
            <option value="en">🇬🇧 EN</option>
            <option value="de">🇩🇪 DE</option>
            <option value="es">🇪🇸 ES</option>
            <option value="fr">🇫🇷 FR</option>
          </select>
        </div>
      )}
    </header>
  )
}
