import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "../components/pwa/ServiceWorkerRegister";
import { SyncLifecycle } from "../components/pwa/SyncLifecycle";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kan — your shop, in one place",
    template: "%s · Kan",
  },
  description:
    "Kan is a commerce platform for Ugandan shops by Pwata Inc: sell offline at the counter, keep stock and credit straight, and grow online.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Kan", statusBarStyle: "default" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={notoSans.variable}>
      <body>
        {children}
        <ServiceWorkerRegister />
        <SyncLifecycle />
      </body>
    </html>
  );
}
