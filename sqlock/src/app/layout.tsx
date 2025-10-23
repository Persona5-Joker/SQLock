import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "SQLock",
  description: "SQLock - SQLi detection demo",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <TRPCReactProvider>
          <nav className="bg-slate-900 text-white px-6 py-3 flex items-center gap-6">
            <div className="font-bold text-lg">SQLock</div>
            <div className="flex gap-4">
              <a href="/input" className="hover:text-blue-300">
                Input
              </a>
              <a href="/logs" className="hover:text-blue-300">
                Logs
              </a>
              <a href="/flags" className="hover:text-blue-300">
                Flags
              </a>
            </div>
          </nav>
          <main className="p-6">{children}</main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
