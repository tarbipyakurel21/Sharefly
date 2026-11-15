import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { getSessionUser } from "@/lib/auth";
import { newMatchCount } from "@/lib/db/queries";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const head = Fraunces({ subsets: ["latin"], variable: "--font-head", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ShareFly: give it away, find what you need", template: "%s · ShareFly" },
  description: "Give things away in seconds. Find what you need nearby, check it fits your room, and get help picking it up.",
};
export const viewport: Viewport = { themeColor: "#faf7f2", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const matches = user ? await newMatchCount(user.id) : 0;
  return (
    <html lang="en" className={`${body.variable} ${head.variable}`}>
      <body className="min-h-screen pb-24">
        <ToastProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
          <Header user={user} />
          <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10">{children}</main>
          <MobileNav matches={matches} />
        </ToastProvider>
      </body>
    </html>
  );
}
