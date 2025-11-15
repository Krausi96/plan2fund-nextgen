import { useI18n } from "@/shared/contexts/I18nContext"
import { Languages } from "lucide-react"

type Props = {
  compact?: boolean
}

export default function LanguageSwitcher({ compact }: Props) {
  const { locale, setLocale } = useI18n()

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale)
    // Force a page refresh to ensure all components re-render with new locale
    window.location.reload()
  }

  const languageOptions = [
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'de', name: 'Deutsch', short: 'DE' },
  ]

  return (
    <div className="relative">
      <Languages className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none z-10" />
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className={`border-2 border-gray-400 rounded-lg pl-8 pr-3 py-1.5 text-sm font-semibold bg-white text-gray-900 hover:border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-colors cursor-pointer shadow-sm ${compact ? "text-sm" : "text-base"}`}
        style={{ color: '#111827' }}
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
            {lang.short}
          </option>
        ))}
      </select>
    </div>
  )
}



