import { useState } from "react"

type Props = {
  compact?: boolean
}

export default function LanguageSwitcher({ compact }: Props) {
  const [lang, setLang] = useState("en")

  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className={`border rounded px-2 py-1 text-sm ${compact ? "" : ""}`}
    >
      <option value="en">🇬🇧 EN</option>
      <option value="de">🇩🇪 DE</option>
      <option value="es">🇪🇸 ES</option>
      <option value="fr">🇫🇷 FR</option>
    </select>
  )
}



