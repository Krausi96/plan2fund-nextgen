import AppShell from "@/components/layout/AppShell"
import SideNav from "@/components/plan/SideNav"
import Editor from "@/components/plan/Editor"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function plan() {
  return (
    <AppShell breadcrumb={['Home','plan']}>
      
  return (
    <div className="max-w-6xl mx-auto py-10 grid grid-cols-4 gap-6">
      <aside className="col-span-1"><SideNav current="overview" setCurrent={() => {}} /></aside>
      <section className="col-span-3 space-y-6">
        <h1 className="text-2xl font-bold">Business Plan Editor</h1>
        <Progress value={30} />
        <Editor content="" onChange={() => {}} />
        <div className="flex justify-end">
          <Link href="/preview"><Button>Continue to Preview</Button></Link>
        </div>
      </section>
    </div>
  )

    </AppShell>
  )
}



