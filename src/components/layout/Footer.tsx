import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white text-gray-600 py-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">
        <div>
          <h3 className="font-semibold mb-3">Plan2Fund</h3>
          <p className="text-sm">Helping founders plan and fund their ventures.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/legal">Legal Notice</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Plan2Fund. All rights reserved.
      </div>
    </footer>
  );
}
