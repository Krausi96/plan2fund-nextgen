import { Header } from "./Header"
import { Footer } from "./Footer"
import Link from "next/link"

interface AppShellProps {
  children: React.ReactNode
  breadcrumb?: string[]
}

export default function AppShell({ children, breadcrumb }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow px-6 py-4">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-4 text-sm text-gray-600">
            {breadcrumb.map((item, idx) => (
              <span key={idx}>
                {idx > 0 && " / "}
                {idx < breadcrumb.length - 1 ? (
                  <Link href={idx === 0 ? "/" : "#"} className="hover:underline">
                    {item}
                  </Link>
                ) : (
                  <span className="font-semibold">{item}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {children}
      </main>
      <Footer />
    </div>
  )
}
