import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music Journey - Transform Your Music",
  description: "Transform your liked songs into intentional listening journeys with emotional arcs.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased bg-black text-white min-h-screen font-sans"
      >
        {children}
      </body>
    </html>
  );
}
