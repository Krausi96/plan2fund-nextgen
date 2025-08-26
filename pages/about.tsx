import AppShell from "@/components/layout/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">About Us</h1>
        <p className="text-gray-700">
          I&apos;m a startup advisor based in Austria with a background in business modelling,
          planning and funding. I&apos;ve helped founders secure grants and loans —
          including FFG Basisprogramm and Wirtschaftagentur Wien.
        </p>
      </div>
    </AppShell>
  );
}
