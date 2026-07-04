"use client";

// Shared building blocks for the Science Labs tools.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ToolHeader({ title, subtitle, icon, tone = "brand", backHref = "/hub/science" }: { title: string; subtitle?: string; icon?: React.ReactNode; tone?: string; backHref?: string }) {
  return (
    <div className="mb-6">
      <Link href={backHref} className="btn-ghost btn-sm mb-3 -ml-2"><ArrowLeft size={15} /> Science Labs</Link>
      <div className="flex items-start gap-3">
        {icon && <div className={cn("mt-0.5 grid h-11 w-11 place-items-center rounded-xl", `bg-${tone}-500/12 text-${tone}-500`)}>{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function Tool({ title, icon, children, className }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("h-full", className)}>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">{icon}{title}</h2>
        {children}
      </Card>
    </motion.div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

export function ResultRow({ label, value, tone = "brand" }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-edge px-3 py-2">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={cn("font-mono text-sm font-semibold", `text-${tone}-600 dark:text-${tone}-300`)}>{value}</span>
    </div>
  );
}

export function ResultBox({ children, tone = "brand" }: { children: React.ReactNode; tone?: string }) {
  return <div className={cn("rounded-xl border p-4", `border-${tone}-500/30 bg-${tone}-500/5`)}>{children}</div>;
}
