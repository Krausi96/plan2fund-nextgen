export function Footer() {
  return (
    <footer className="w-full py-6 border-t text-sm text-gray-600 bg-white">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-between gap-4">
        <div className="flex gap-4">
          <a href="/contact">Contact</a>
          <a href="/terms">Terms & Conditions</a>
          <a href="/privacy">Data Privacy</a>
          <a href="/legal">Legal Notice</a>
        </div>
        <div>©2025 Plan2Fund. All rights reserved.</div>
      </div>
    </footer>
  )
}
