"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // determine initial theme: localStorage > system preference
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = stored ? stored === "dark" : prefersDark;
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    } catch {
      // ignore (SSR guard)
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle("dark", next);
  };

  // avoid rendering until mounted to prevent hydration mismatch
  if (isDark === null) return null;

  return (
    <button
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        // sun icon (when dark -> show sun to indicate light)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.995 12c0 2.761 2.246 5.005 5.005 5.005s5.005-2.244 5.005-5.005c0-2.761-2.246-5.005-5.005-5.005S6.995 9.239 6.995 12zm13.705-.5h2.3a.5.5 0 010 1h-2.3a.5.5 0 010-1zM1 11.5h2.3a.5.5 0 010 1H1a.5.5 0 010-1zm11-9v2.3a.5.5 0 01-1 0V2.5a.5.5 0 011 0zM12 19.2v2.3a.5.5 0 01-1 0v-2.3a.5.5 0 011 0zM4.22 5.636l1.63 1.63a.5.5 0 01-.707.707l-1.63-1.63a.5.5 0 01.707-.707zM18.857 17.273l1.63 1.63a.5.5 0 11-.707.707l-1.63-1.63a.5.5 0 11.707-.707zM18.857 6.363a.5.5 0 10-.707-.707l-1.63 1.63a.5.5 0 10.707.707l1.63-1.63zM5.85 17.273a.5.5 0 10-.707.707l1.63 1.63a.5.5 0 10.707-.707l-1.63-1.63z" />
        </svg>
      ) : (
        // moon icon (when light -> show moon to indicate dark)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-200" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.64 13.02A9 9 0 1110.98 2.36 7 7 0 0021.64 13.02z" />
        </svg>
      )}
    </button>
  );
}
