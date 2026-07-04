import Link from "next/link";
import { Brain, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-glow">
        <Brain size={32} />
      </div>
      <h1 className="mt-6 text-6xl font-extrabold tracking-tight">404</h1>
      <p className="mt-2 text-lg text-ink-muted">This page went off to study somewhere else.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/app" className="btn-primary"><Home size={16} /> Go to dashboard</Link>
        <Link href="/" className="btn-secondary">Back home</Link>
      </div>
    </div>
  );
}
