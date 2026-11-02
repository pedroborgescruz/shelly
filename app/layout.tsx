import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shelly — learn the Unix shell by using it",
  description:
    "An interactive terminal playground that teaches the Unix shell: navigation, file manipulation, redirection and pipes, one puzzle at a time.",
};

export const viewport: Viewport = {
  themeColor: "#1a1b26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetBrainsMono.variable}>
      <body>{children}</body>
    </html>
  );
}
