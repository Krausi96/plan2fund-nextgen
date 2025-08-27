import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
        {/* Left: Links */}
        <div className="flex gap-6">
          <Link href="/contact" className="hover:text-blue-600">Contact</Link>
          <Link href="/terms" className="hover:text-blue-600">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-blue-600">Data Privacy</Link>
          <Link href="/legal" className="hover:text-blue-600">Legal Notice</Link>
        </div>

        {/* Right: Copyright */}
        <div className="text-gray-500">
          ©2025 Plan2Fund. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
