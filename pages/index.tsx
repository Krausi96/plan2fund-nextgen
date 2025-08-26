import AppShell from "../components/layout/AppShell";
import Link from "next/link";

export default function HomePage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl text-center py-16">
        <h1 className="text-4xl font-bold">Welcome to Plan2Fund NextGen</h1>
        <p className="mt-4 text-lg text-gray-600">
          Your AI-powered funding assistant for visas, grants, loans, and startup growth.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/reco" className="rounded-xl bg-blue-600 px-6 py-3 text-white">Find Funding</Link>
          <Link href="/plan" className="rounded-xl border px-6 py-3">Generate Plan</Link>
        </div>
      </section>
    </AppShell>
  );
}
