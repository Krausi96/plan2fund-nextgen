import { useI18n } from "@/contexts/I18nContext"
import { useRouter } from "next/router"

type Props = {
  compact?: boolean
}

export default function LanguageSwitcher({ compact }: Props) {
  const { locale, setLocale } = useI18n()
  const router = useRouter()

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale)
    // Update the URL with the new locale
    router.push(router.asPath, router.asPath, { locale: newLocale })
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



