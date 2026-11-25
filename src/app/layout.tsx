import type { Metadata } from "next";
import { ServiceWorkerRegister } from "../components/pwa/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kan — your shop, in one place",
    template: "%s · Kan",
  },
  description:
    "Kan is a commerce platform for Ugandan shops: sell offline, keep stock and credit straight, and open your storefront when you are ready.",
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
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
