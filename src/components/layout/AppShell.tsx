import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { useRouter } from "next/router";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const showBreadcrumbs = !["/", "/about", "/pricing", "/legal", "/privacy"].includes(router.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 shadow-sm bg-white">
        <Header />
      </header>
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-8">
        {showBreadcrumbs && <Breadcrumbs />}
        {children}
      </main>
      <footer className="mt-auto border-t bg-gray-50">
        <Footer />
      </footer>
    </div>
  );
}

