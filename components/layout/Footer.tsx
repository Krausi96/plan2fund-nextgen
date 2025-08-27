import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 text-sm">
      <div className="container mx-auto py-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-4">
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/legal">Legal</Link>
        </div>
        <p className="text-muted-foreground">© {new Date().getFullYear()} Plan2Fund. All rights reserved.</p>
      </div>
    </footer>
  )
}
