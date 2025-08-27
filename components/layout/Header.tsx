import Link from "next/link"

export function Header() {
  return (
    <header className="border-b bg-white">
      <nav className="container mx-auto flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl">Plan2Fund</Link>

        {/* Navigation */}
        <div className="flex gap-6">
          <Link href="/about">About Us</Link>
          <Link href="/pricing">Pricing</Link>
        </div>

        {/* Language Dropdown */}
        <select className="border rounded px-2 py-1 text-sm">
          <option>EN</option>
          <option>DE</option>
        </select>
      </nav>
    </header>
  )
}
