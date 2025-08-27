"use client"
import Link from "next/link"

export default function Header() {
  return (
    <header className="w-full border-b bg-white shadow-sm px-6 py-3 flex justify-between items-center">
      <Link href="/" className="text-lg font-bold text-blue-600">Plan2Fund</Link>
      <nav className="flex gap-6 items-center">
        <Link href="/about" className="hover:text-blue-500">About</Link>
        <Link href="/pricing" className="hover:text-blue-500">Pricing</Link>
        <select className="border rounded px-2 py-1 text-sm">
          <option>EN</option>
          <option>DE</option>
          <option>ES</option>
          <option>FR</option>
        </select>
      </nav>
    </header>
  )
}
