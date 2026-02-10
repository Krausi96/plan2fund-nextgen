import "../styles/globals.css";
import type { AppProps } from "next/app";
import AppShell from "@/shared/components/layout/AppShell";
import { I18nProvider } from "@/shared/contexts/I18nContext";
import { ProjectContextProvider } from "@/platform/core/context/ProjectContext";
import { useEffect } from "react";
import Script from "next/script";

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const key = "pf_session";
      const existing = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith(`${key}=`));
      if (!existing) {
        const id = Math.random().toString(36).slice(2);
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${key}=${id}; path=/; expires=${expires}`;
      }
    } catch {}
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />

      <I18nProvider>
        <ProjectContextProvider>
          <AppShell>
            <Component {...pageProps} />
          </AppShell>
        </ProjectContextProvider>
      </I18nProvider>
    </>
  );
}



