import Link from "next/link"

export default function Breadcrumbs({ items = [] }: { items?: { label: string, href?: string }[] }) {
  if (!items.length) return null
  return (
    <nav className="p-2 text-sm text-gray-600">
      {items.map((item, idx) => (
        <span key={idx}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          {idx < items.length - 1 && " / "}
        </span>
      ))}
    </nav>
  )
}
