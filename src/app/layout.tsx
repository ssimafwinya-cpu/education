import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { StoreProvider } from "@/lib/store";
import { AccountProvider } from "@/lib/account";
import { ToastHost } from "@/components/ui";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Cognify — AI Learning Platform",
  description:
    "Cognify is an AI-powered learning platform: AI tutoring, spaced-repetition flashcards (FSRS), smart notes, quizzes, exams, study planning, analytics and gamification — all in one place.",
  applicationName: "Cognify",
  keywords: ["learning", "AI tutor", "flashcards", "spaced repetition", "FSRS", "study", "quizzes", "notes"],
  authors: [{ name: "Cognify" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: { capable: true, title: "Cognify", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Cognify — Learn anything, faster",
    description: "AI tutoring, spaced repetition, smart notes and adaptive quizzes in one beautiful app.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#090c14" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the persisted theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cognify.theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="app-aurora">
        <ThemeProvider>
          <StoreProvider>
            <AccountProvider>
              <ToastHost>{children}</ToastHost>
            </AccountProvider>
          </StoreProvider>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
