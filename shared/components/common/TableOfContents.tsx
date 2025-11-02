type TableOfContentsProps = {
  sections: Array<{ key: string; title: string }>
  onNavigate?: (key: string) => void
}

export default function TableOfContents({ sections, onNavigate }: TableOfContentsProps) {
  return (
    <ol className="list-decimal ml-6 space-y-1">
      {sections.map(s => (
        <li key={s.key}>
          <button className="text-blue-700 hover:underline" onClick={()=>onNavigate?.(s.key)}>{s.title}</button>
        </li>
      ))}
    </ol>
  )
}



