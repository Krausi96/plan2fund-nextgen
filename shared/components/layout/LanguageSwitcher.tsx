import { useI18n } from "@/shared/contexts/I18nContext"

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
    { code: 'en', flag: '🇬🇧', name: 'EN' },
    { code: 'de', flag: '🇩🇪', name: 'DE' },
  ]

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className={`border rounded px-2 py-1 text-sm bg-white ${compact ? "text-sm" : "text-base"}`}
    >
      {languageOptions.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  )
}



