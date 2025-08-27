import Link from "next/link"

export function Header() {
  return (
    <header className="flex justify-between items-center px-6 py-4 border-b bg-white">
      <Link href="/" className="font-bold text-xl text-blue-600">Plan2Fund</Link>
      <nav className="flex gap-6">
        <Link href="/about">About Us</Link>
        <Link href="/pricing">Pricing</Link>
        <select className="border rounded px-2 py-1">
          <option>EN</option>
          <option>DE</option>
          <option>ES</option>
          <option>FR</option>
        </select>
      </nav>
    </header>
  )
}
