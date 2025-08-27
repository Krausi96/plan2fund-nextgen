import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ease: 'easeInOut', duration: 0.6 }}
      className="w-full border-t bg-gray-50 px-6 py-6 text-sm flex flex-col md:flex-row justify-between items-center gap-4"
    >
      <nav className="flex gap-4">
        <Link href="/contact" className="hover:text-blue-500">Contact</Link>
        <Link href="/terms" className="hover:text-blue-500">Terms & Conditions</Link>
        <Link href="/privacy" className="hover:text-blue-500">Data Privacy</Link>
        <Link href="/legal" className="hover:text-blue-500">Legal Notice</Link>
      </nav>
      <span className="text-gray-500">©2025 Plan2Fund. All rights reserved.</span>
    </motion.footer>
  )
}
