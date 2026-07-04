import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { StoreProvider } from "@/lib/store";
import { AccountProvider } from "@/lib/account";
import { ToastHost } from "@/components/ui";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "UNZANASA — Natural Sciences Student Association & Academic Hub",
  description:
    "The official digital ecosystem of the University of Zambia Natural Sciences Student Association: association services plus an AI-powered Academic Hub with discipline-specific science tools, tutoring, spaced-repetition flashcards, quizzes, planning and research tools.",
  applicationName: "UNZANASA",
  keywords: ["UNZANASA", "University of Zambia", "Natural Sciences", "student association", "academic hub", "AI tutor", "biology", "chemistry", "physics", "mathematics", "flashcards", "FSRS"],
  authors: [{ name: "UNZANASA" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: { capable: true, title: "UNZANASA", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "UNZANASA — Digital Academic Ecosystem",
    description: "Association services + an AI Academic Hub built for Natural Sciences students.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#031d15" },
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
            __html: `(function(){try{var t=localStorage.getItem('unzanasa.theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
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
