'use client'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'EN', flag: '🇬🇧' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'ES', flag: '🇪🇸' },
  { code: 'FR', flag: '🇫🇷' },
]

export default function Header() {
  const [lang, setLang] = useState('EN')

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: 'easeInOut', duration: 0.5 }}
      className="w-full border-b bg-white shadow-sm px-6 py-4 flex justify-between items-center"
    >
      <Link href="/" className="text-lg font-bold text-blue-600 hover:text-blue-800">
        Plan2Fund
      </Link>
      <nav className="flex gap-6 items-center">
        <Link href="/about" className="hover:text-blue-500">About</Link>
        <Link href="/pricing" className="hover:text-blue-500">Pricing</Link>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-white"
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.code}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </motion.header>
  )
}
