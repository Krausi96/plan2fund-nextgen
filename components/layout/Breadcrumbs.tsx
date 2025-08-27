import Link from "next/link"
import { useRouter } from "next/router"

export function Breadcrumbs() {
  const router = useRouter()
  const segments = router.asPath.split("/").filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav className="text-sm mb-6 text-gray-500">
      <ol className="flex gap-2">
        <li>
          <Link href="/">Home</Link>
        </li>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/")
          return (
            <li key={href} className="flex gap-2">
              <span>/</span>
              <Link href={href} className="capitalize">{seg}</Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
