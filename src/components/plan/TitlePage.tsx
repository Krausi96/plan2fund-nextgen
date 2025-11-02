import { useState, useEffect } from 'react'

export type TitlePageData = {
  title: string
  subtitle?: string
  author?: string
  date?: string
}

type TitlePageProps = {
  onUpdate: (data: TitlePageData) => void
  initialData?: TitlePageData
}

export default function TitlePage({ onUpdate, initialData }: TitlePageProps) {
  const [data, setData] = useState<TitlePageData>(initialData || { title: 'Business Plan' })
  useEffect(() => { onUpdate(data) }, [data, onUpdate])
  return (
    <div className="space-y-3">
      <input className="w-full border rounded px-3 py-2" placeholder="Title" value={data.title} onChange={e=>setData({ ...data, title: e.target.value })} />
      <input className="w-full border rounded px-3 py-2" placeholder="Subtitle" value={data.subtitle || ''} onChange={e=>setData({ ...data, subtitle: e.target.value })} />
      <input className="w-full border rounded px-3 py-2" placeholder="Author" value={data.author || ''} onChange={e=>setData({ ...data, author: e.target.value })} />
      <input className="w-full border rounded px-3 py-2" placeholder="Date" value={data.date || ''} onChange={e=>setData({ ...data, date: e.target.value })} />
    </div>
  )
}



