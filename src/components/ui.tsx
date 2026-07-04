"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ className, hover, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn("card p-5", hover && "card-hover", className)} {...rest}>
      {children}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn("relative w-full glass rounded-2xl shadow-lift", widths[size])}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-edge px-5 py-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button onClick={onClose} className="btn-ghost btn-sm -mr-2" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────
export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "accent" | "amber" | "rose" }) {
  const tones = {
    brand: "from-brand-500 to-brand-400",
    accent: "from-teal-500 to-teal-400",
    amber: "from-amber-500 to-amber-400",
    rose: "from-rose-500 to-rose-400",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface", className)}>
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r", tones[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

// ─── Progress ring ───────────────────────────────────────────────────────────
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  children,
  color = "#6366f1",
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--edge))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────────
export function Stat({
  label,
  value,
  icon,
  tone = "brand",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: string;
  sub?: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", `bg-${tone}-500/12 text-${tone}-500`)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight tracking-tight">{value}</div>
        <div className="truncate text-sm text-ink-muted">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-ink-faint">{sub}</div>}
      </div>
    </Card>
  );
}

// ─── Badge / chip ────────────────────────────────────────────────────────────
export function Badge({ children, tone = "brand", className }: { children: React.ReactNode; tone?: string; className?: string }) {
  return (
    <span className={cn("chip", `bg-${tone}-500/12 text-${tone}-600 dark:text-${tone}-300`, className)}>{children}</span>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge-strong py-14 text-center">
      {icon && <div className="mb-3 text-4xl opacity-70">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Segmented control ───────────────────────────────────────────────────────
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-edge bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative rounded-lg px-3 py-1.5 text-sm font-medium transition",
            value === o.value ? "text-ink" : "text-ink-muted hover:text-ink",
          )}
        >
          {value === o.value && (
            <motion.div
              layoutId="segmented-active"
              className="absolute inset-0 rounded-lg bg-surface-raised shadow-soft"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Toast host ──────────────────────────────────────────────────────────────
interface Toast {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
}
const ToastCtx = React.createContext<(t: Omit<Toast, "id">) => void>(() => {});
export function useToast() {
  return React.useContext(ToastCtx);
}
export function ToastHost({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className="pointer-events-auto glass flex items-start gap-3 rounded-xl p-3.5 shadow-lift"
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              {t.emoji && <div className="text-2xl">{t.emoji}</div>}
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t.title}</div>
                {t.description && <div className="text-xs text-ink-muted">{t.description}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Confirm-in-place delete button ─────────────────────────────────────────
export function ConfirmButton({
  onConfirm,
  children,
  className,
  confirmLabel = "Sure?",
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  className?: string;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = React.useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) onConfirm();
        else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
