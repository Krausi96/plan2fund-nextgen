import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={inter.variable} style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </div>
  );
}
