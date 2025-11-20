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
        className={`border border-neutral-700 text-neutral-700 rounded-lg pl-8 pr-3 py-1.5 text-sm font-medium bg-white hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-colors cursor-pointer ${compact ? "text-sm" : "text-base"}`}
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {getFlag(lang.code)} {lang.short}
          </option>
        ))}
      </select>
      <Languages className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 text-neutral-600" />
    </div>
  )
}



