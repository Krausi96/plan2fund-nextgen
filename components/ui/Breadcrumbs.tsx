import React from 'react'
type Crumb = { label: string; href?: string }
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-6 text-sm text-slate-500">
      {items.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2 text-slate-400">/</span>}
          {c.href ? <a className="hover:underline" href={c.href}>{c.label}</a> : <span>{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
