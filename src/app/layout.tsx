// app/layout.tsx
import type { Metadata } from "next";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Planner",
  description: "Plan your next adventure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexendDeca.variable} antialiased bg-black text-white font-[family-name:var(--font-lexend-deca)]`}
      >
        <main className="min-h-screen flex flex-col items-start justify-center p-6">
          {children}
        </main>
      </body>
    </html>
  );
}