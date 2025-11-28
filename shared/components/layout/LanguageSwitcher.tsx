import { useI18n } from "@/shared/contexts/I18nContext"
import { Languages } from "lucide-react"

type Props = {
  compact?: boolean
}

export default function LanguageSwitcher({ compact }: Props) {
  const { locale, setLocale } = useI18n()

  const handleLanguageChange = (newLocale: string) => {
    try {
      // Validate locale before setting
      if (!newLocale || typeof newLocale !== 'string') {
        console.error('Invalid locale provided:', newLocale);
        return;
      }
      
      setLocale(newLocale);
      
      // Use a small delay before reload to ensure state is saved
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 100);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  const languageOptions = [
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'de', name: 'Deutsch', short: 'DE' },
  ]

  const getFlag = (code: string) => {
    return code === 'de' ? '🇩🇪' : '🇬🇧';
  };

  const basePadding = compact ? 'py-2 px-4' : 'py-2.5 px-5'

  return (
    <div className="relative inline-flex items-center group">
      <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-blue-600 transition-colors group-hover:text-white" />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-blue-600 transition-colors group-hover:text-white"
      >
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className={`appearance-none bg-white font-semibold tracking-wide uppercase border-2 border-blue-600 text-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-700 pl-10 pr-10 ${basePadding}`}
      >
        {languageOptions.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {`${getFlag(lang.code)} ${lang.short}`}
          </option>
        ))}
      </select>
    </div>
  )
}



