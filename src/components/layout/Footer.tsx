import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t bg-gray-50 px-6 py-4 text-sm flex justify-between items-center">
      <nav className="flex gap-4">
        <Link href="/contact" className="hover:text-blue-500">Contact</Link>
        <Link href="/terms" className="hover:text-blue-500">Terms</Link>
        <Link href="/privacy" className="hover:text-blue-500">Privacy</Link>
        <Link href="/legal" className="hover:text-blue-500">Legal</Link>
      </nav>
      <span className="text-gray-500">©2025 Plan2Fund. All rights reserved.</span>
    </footer>
  )
}
