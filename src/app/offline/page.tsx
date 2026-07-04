import Link from "next/link";
import { Brain, WifiOff, RefreshCw } from "lucide-react";

export const metadata = { title: "Offline — Cognify" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow">
        <Brain size={32} />
      </div>
      <WifiOff size={28} className="mt-6 text-ink-faint" />
      <h1 className="mt-4 text-2xl font-bold">You're offline</h1>
      <p className="mt-2 max-w-sm text-ink-muted">
        No internet connection right now. Your notes, flashcards and reviews are stored on this device — most of Cognify keeps working offline.
      </p>
      <Link href="/app" className="btn-primary mt-6"><RefreshCw size={16} /> Back to the app</Link>
    </div>
  );
}
