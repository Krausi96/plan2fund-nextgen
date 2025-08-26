import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link href="/" className="font-bold text-xl text-blue-600">Plan2Fund</Link>
        <nav className="flex gap-6">
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/reco">Recommendation</Link>
          <Link href="/plan">Plan Generator</Link>
        </nav>
      </div>
    </header>
  );
}
