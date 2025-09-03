import "../styles/globals.css"
import type { AppProps } from "next/app"
import AppShell from "@/components/layout/AppShell"
import { useEffect } from "react"

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    try {
      const key = "pf_session"
      const existing = document.cookie.split(";").find((c) => c.trim().startsWith(`${key}=`))
      if (!existing) {
        const id = Math.random().toString(36).slice(2)
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
        document.cookie = `${key}=${id}; path=/; expires=${expires}`
      }
    } catch {}
  }, [])
  return (
    <AppShell>
      <Component {...pageProps} />
    </AppShell>
  )
}


