import "../styles/globals.css";
import type { AppProps } from "next/app";
import AppShell from "@/shared/components/layout/AppShell";
import { UserProvider } from "@/shared/user/context/UserContext";
import { I18nProvider } from "@/shared/contexts/I18nContext";
import { RecommendationProvider } from "@/features/reco/contexts/RecommendationContext";
import { useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import analytics from "@/shared/user/analytics";

function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analytics.trackPageView(url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return <>{children}</>;
}

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
        <UserProvider>
          <RecommendationProvider>
            <AnalyticsWrapper>
              <AppShell>
                <Component {...pageProps} />
              </AppShell>
            </AnalyticsWrapper>
          </RecommendationProvider>
        </UserProvider>
      </I18nProvider>
    </>
  );
}



