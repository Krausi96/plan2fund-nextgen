import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-3xl font-bold mb-2">Welcome to Plan2Fund NextGen</h1>
      <p className="mb-6 text-gray-600">Your journey to funding success starts here.</p>
      <div className="flex gap-4">
        <Link href="/reco"><Button>Get Recommendations</Button></Link>
        <Link href="/plan"><Button variant="outline">Build Your Plan</Button></Link>
      </div>
    </main>
  )
}
