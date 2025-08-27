import type { AppProps } from "next/app"
import "@/styles/globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-6">
        <Breadcrumbs />
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  )
}
