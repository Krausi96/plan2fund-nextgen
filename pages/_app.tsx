import type { AppProps } from "next/app"
import "./../styles/globals.css"

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Breadcrumbs from '@/components/layout/Breadcrumbs'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Breadcrumbs />
      <main className="flex-1">
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  )
}

