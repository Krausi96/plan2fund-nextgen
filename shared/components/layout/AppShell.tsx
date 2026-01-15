import Header from "@/shared/components/layout/Header";
import Footer from "@/shared/components/layout/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      
      <main id="main-content" className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}

