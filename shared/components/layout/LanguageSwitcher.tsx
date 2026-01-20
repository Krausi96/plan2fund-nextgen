import { useI18n } from "@/shared/contexts/I18nContext"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

type Props = {
  compact?: boolean
}

export default function LanguageSwitcher({ compact }: Props) {
  const { locale, setLocale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true);
  }, [])

  const handleLanguageChange = (newLocale: string) => {
    console.log('LanguageSwitcher: handleLanguageChange called with', newLocale);
    console.log('LanguageSwitcher: Current locale before change:', locale);
    setLocale(newLocale);
    setIsOpen(false);
    console.log('LanguageSwitcher: Locale change initiated');
    // No reload needed - React will re-render components with new translations
  }

  const languageOptions = [
    { code: 'en', name: 'English', short: 'EN' },
    { code: 'de', name: 'Deutsch', short: 'DE' },
  ]

  const getFlag = (code: string) => {
    return code === 'de' ? '🇩🇪' : '🇬🇧';
  };

  const getCurrentLanguage = () => {
    return languageOptions.find(lang => lang.code === locale) || languageOptions[0];
  };

  const basePadding = compact ? 'py-2 px-4' : 'py-2.5 px-5'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the trigger button and the dropdown portal
      const isClickOnTrigger = dropdownRef.current && dropdownRef.current.contains(event.target as Node);
      
      // Check if click is on the dropdown portal (which is rendered to document.body)
      const dropdownElement = document.querySelector('.language-switcher-dropdown');
      const isClickOnDropdown = dropdownElement && dropdownElement.contains(event.target as Node);
      
      if (!isClickOnTrigger && !isClickOnDropdown) {
        console.log('LanguageSwitcher: Click outside detected, closing dropdown');
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center group" ref={dropdownRef} style={{ zIndex: 1001 }}>
      <button
        type="button"
        aria-label="Language"
        onClick={() => {
          console.log('LanguageSwitcher: Main button clicked');
          setIsOpen(prev => {
            const newState = !prev;
            console.log('LanguageSwitcher: Setting dropdown open to', newState);
            return newState;
          });
        }}
        className={`appearance-none bg-white font-semibold tracking-wide uppercase border-2 border-blue-600 text-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-700 px-5 flex items-center justify-between gap-2 w-full ${basePadding} !text-blue-700`}
      >
        <span>{`${getFlag(getCurrentLanguage().code)} ${getCurrentLanguage().short}`}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
      </button>
      
      {/* Render dropdown via portal to avoid z-index conflicts */}
      {typeof window !== 'undefined' && isClient && isOpen && createPortal(
        <div 
          className="fixed bg-white border-2 border-blue-600 rounded-xl shadow-lg z-[10002] min-w-[120px] language-switcher-dropdown"
          style={{
            top: `${dropdownRef.current?.getBoundingClientRect().bottom || 0}px`,
            left: `${dropdownRef.current?.getBoundingClientRect().left || 0}px`,
            width: `${dropdownRef.current?.offsetWidth || 120}px`
          }}
        >
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                console.log('LanguageSwitcher: Language option clicked:', lang.code);
                handleLanguageChange(lang.code);
              }}
              className={`w-full text-left px-4 py-2.5 text-blue-700 font-semibold tracking-wide uppercase hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${locale === lang.code ? 'bg-blue-100' : ''} !text-blue-700`}
            >
              {`${getFlag(lang.code)} ${lang.short}`}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}



