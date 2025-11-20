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

  const getFlag = (code: string) => {
    return code === 'de' ? '🇩🇪' : '🇬🇧';
  };

  return (
    <div className="relative">
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className={`border-2 border-gray-200 text-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-sm font-medium bg-white hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${compact ? "text-sm py-2" : "text-base"}`}
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {getFlag(lang.code)} {lang.short}
          </option>
        ))}
      </select>
      <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 text-gray-400" />
    </div>
  )
}



