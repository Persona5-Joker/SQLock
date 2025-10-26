import "~/styles/globals.css";

import Link from "next/link";
import { type Metadata } from "next";
import { Geist } from "next/font/google";

import SplashIntro from "~/components/SplashIntro";
import ThemeToggle from "~/components/ThemeToggle";
import teamData from "~/data/team.json";

type TeamMember = { name: string; role?: string; linkedin?: string; img?: string };
type TeamData = { projectRepo?: string; team?: TeamMember[] };
const _teamData = teamData as TeamData;

export const metadata: Metadata = {
  title: "SQLock",
  description: "SQLock - SQLi detection demo",
  icons: [{ rel: "icon", url: "/SQLockLogo2.png" }],
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
          <SplashIntro />
          <nav className="bg-slate-900 text-white px-6 py-3">
            <div className="max-w-6xl mx-auto flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="font-bold text-lg hover:text-blue-300">
                  SQLock
                </Link>
              </div>

              <div className="flex-1 flex justify-center">
                <div className="flex gap-6">
                  <Link href="/input" className="hover:text-blue-300">
                    Input
                  </Link>
                  <Link href="/logs" className="hover:text-blue-300">
                    Logs
                  </Link>
                  <Link href="/flags" className="hover:text-blue-300">
                    Flags
                  </Link>
                </div>
              </div>

                <div className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <a
                    href={_teamData.projectRepo}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded hover:bg-slate-800"
                    aria-label="Open project on GitHub"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-white"
                    >
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.744.083-.729.083-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.123-.303-.535-1.527.117-3.176 0 0 1.008-.322 3.301 1.23.958-.266 1.984-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.649.242 2.873.12 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.805 5.62-5.476 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                  </a>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>
          <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
