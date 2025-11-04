import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ProgramLegacyPage() {
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      // Legacy deep link: redirect to library with preselected program when available
      router.replace(`/library?programId=${encodeURIComponent(String(id))}`)
    }
  }, [id])

  return (
    <main className="min-h-[40vh] flex items-center justify-center">
      <div className="text-gray-600">Loading program…</div>
    </main>
  )
}






