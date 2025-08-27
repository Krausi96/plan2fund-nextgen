import "@/styles/globals.css"
import type { AppProps } from "next/app"
import AppShell from "@/components/layout/AppShell"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppShell>
      <Component {...pageProps} />
    </AppShell>
  )
}
