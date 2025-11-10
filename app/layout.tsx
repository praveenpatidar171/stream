import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stream",
  description: "A Next.js application with Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

