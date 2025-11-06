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
      <Languages className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className={`border border-gray-300 rounded-lg px-8 py-1.5 text-sm bg-white hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${compact ? "text-sm" : "text-base"}`}
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.short}
          </option>
        ))}
      </select>
    </div>
  )
}



