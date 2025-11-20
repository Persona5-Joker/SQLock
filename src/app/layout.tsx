import "../styles/globals.css";

import Link from "next/link";
import Image from "next/image";
import { type Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";

import SplashIntro from "~/components/SplashIntro";
import ThemeToggle from "~/components/ThemeToggle";
import { ThemeProvider } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";
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
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <head>
        <Script
          src="https://tweakcn.com/live-preview.min.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 opacity-70 dark:opacity-50" />
            <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#a5b4fc] via-[#38bdf8] to-transparent blur-3xl opacity-60" />
            <div className="absolute top-40 right-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#fbbf24] via-transparent to-transparent blur-3xl opacity-70" />
          </div>

          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-4 z-20 px-6">
              <div className="mx-auto flex max-w-6xl items-center gap-4 rounded-full border border-white/30 bg-card/80 px-6 py-3 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                  <div className="relative h-10 w-10">
                    <Image src="/SQLockLogo2.png" alt="SQLock" fill sizes="40px" className="object-contain" priority />
                  </div>
                  <span className="glow-text text-base sm:text-lg">SQLock</span>
                </Link>

                <div className="hidden flex-1 justify-center md:flex">
                  <NavigationMenu viewport={false}>
                    <NavigationMenuList className="gap-2">
                      {[{ label: "Input", href: "/input" }, { label: "Logs", href: "/logs" }, { label: "Flags", href: "/flags" }].map((item) => (
                        <NavigationMenuItem key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={item.href}
                              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-secondary hover:text-secondary-foreground"
                            >
                              {item.label}
                            </Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Button asChild size="sm" variant="ghost" className="hidden rounded-full border border-border px-4 text-xs uppercase tracking-wider text-foreground/70 md:inline-flex">
                    <a href={_teamData.projectRepo} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  </Button>
                  <Button asChild className="rounded-full bg-gradient-to-br from-primary via-sky-400 to-indigo-500 px-5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition hover:shadow-lg">
                    <Link href="/input">Launch Console</Link>
                  </Button>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="relative z-10 flex-1 px-6 py-10">
              <div className="mx-auto w-full max-w-6xl space-y-12">{children}</div>
            </main>

            <footer className="px-6 pb-10">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl border border-white/30 bg-card/70 px-6 py-4 text-sm text-muted-foreground backdrop-blur-xl dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} SQLock. Crafted for next-gen SQLi defense.</p>
                <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-foreground/60">
                  <span>Detect</span>
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Prevent</span>
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Learn</span>
                </div>
              </div>
            </footer>
          </div>

          <SplashIntro />
        </ThemeProvider>
      </body>
    </html>
  );
}
