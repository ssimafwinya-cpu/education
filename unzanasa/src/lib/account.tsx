"use client";

// ─── Account & cloud sync ────────────────────────────────────────────────────
// Opt-in accounts on top of the local-first store. Guest mode (localStorage
// only) remains the zero-config default. When signed in:
//   · on login: pull the server snapshot (server wins) or seed it from local
//   · on change: debounce-push the whole AppState with optimistic versioning
//   · on 409 conflict (another device wrote): pull and adopt the server state
// The session is an httpOnly cookie, so all calls are plain same-origin fetch.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import type { AppState } from "./types";

export interface AccountUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
  emailVerified?: boolean;
}

export type SyncStatus = "guest" | "syncing" | "synced" | "offline" | "error";

interface AccountCtx {
  user: AccountUser | null;
  status: SyncStatus;
  register(email: string, password: string, name?: string): Promise<{ ok: boolean; error?: string }>;
  login(email: string, password: string): Promise<{ ok: boolean; error?: string }>;
  logout(): Promise<void>;
  syncNow(): Promise<void>;
  /** Re-fetch the session user (e.g. after email verification). */
  refreshUser(): Promise<void>;
}

const Ctx = createContext<AccountCtx | null>(null);

const PUSH_DEBOUNCE_MS = 2500;

/** Map the server's user role onto the client profile role. */
function roleToProfile(role: string): "student" | "teacher" | "admin" {
  const r = role.toLowerCase();
  return r === "admin" || r === "teacher" ? r : "student";
}

async function api<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  let body: T;
  try {
    body = (await res.json()) as T;
  } catch {
    body = {} as T;
  }
  return { status: res.status, body };
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch, ready } = useStore();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<SyncStatus>("guest");
  const versionRef = useRef(0);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextPush = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Pull: adopt the server snapshot, or seed it from local state ──────────
  const pull = useCallback(async (): Promise<void> => {
    const { status: code, body } = await api<{ data: AppState | null; version: number }>("/api/sync");
    if (code !== 200) return;
    versionRef.current = body.version;
    if (body.data && body.data.version === 1) {
      suppressNextPush.current = true; // adopting server state isn't a new edit
      dispatch({ type: "HYDRATE", state: body.data });
    } else {
      // First device: seed the cloud from what we have locally.
      const seeded = await api<{ version: number }>("/api/sync", {
        method: "PUT",
        body: JSON.stringify({ data: stateRef.current, version: 0 }),
      });
      if (seeded.status === 200) versionRef.current = seeded.body.version;
    }
  }, [dispatch]);

  // ── Push: debounced snapshot upload with conflict handling ────────────────
  const push = useCallback(async (): Promise<void> => {
    if (!user) return;
    setStatus("syncing");
    const { status: code, body } = await api<{ version: number }>("/api/sync", {
      method: "PUT",
      body: JSON.stringify({ data: stateRef.current, version: versionRef.current }),
    });
    if (code === 200) {
      versionRef.current = body.version;
      setStatus("synced");
    } else if (code === 409) {
      // Another device wrote first — its state wins; ours is replaced.
      await pull();
      setStatus("synced");
    } else if (code === 401) {
      setUser(null);
      setStatus("guest");
    } else {
      setStatus("error");
    }
  }, [user, pull]);

  // ── Resume an existing session on load ────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const { status: code, body } = await api<{ user: AccountUser | null }>("/api/auth/me");
      if (cancelled) return;
      if (code === 200 && body.user) {
        setUser(body.user);
        setStatus("syncing");
        await pull();
        // Apply the server's role AFTER hydrating the snapshot, so a promotion
        // (e.g. via set-role) always wins over the role stored in the snapshot.
        if (!cancelled) {
          dispatch({ type: "UPDATE_PROFILE", patch: { role: roleToProfile(body.user.role) } });
          setStatus("synced");
        }
      }
    })().catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ── Debounced push on every local change while signed in ──────────────────
  useEffect(() => {
    if (!user || !ready) return;
    if (suppressNextPush.current) {
      suppressNextPush.current = false;
      return;
    }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => { push().catch(() => setStatus("error")); }, PUSH_DEBOUNCE_MS);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user, ready]);

  // ── Reflect connectivity ───────────────────────────────────────────────────
  useEffect(() => {
    const onOffline = () => user && setStatus("offline");
    const onOnline = () => { if (user) push().catch(() => {}); };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [user, push]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { status: code, body } = await api<{ user?: AccountUser; error?: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    if (code === 201 && body.user) {
      setUser(body.user);
      dispatch({ type: "UPDATE_PROFILE", patch: { name: body.user.name, email: body.user.email } });
      setStatus("syncing");
      await pull();
      setStatus("synced");
      return { ok: true };
    }
    return { ok: false, error: body.error ?? "Registration failed." };
  }, [dispatch, pull]);

  const login = useCallback(async (email: string, password: string) => {
    const { status: code, body } = await api<{ user?: AccountUser; error?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (code === 200 && body.user) {
      setUser(body.user);
      setStatus("syncing");
      await pull();
      dispatch({ type: "UPDATE_PROFILE", patch: { role: roleToProfile(body.user.role) } });
      setStatus("synced");
      return { ok: true };
    }
    return { ok: false, error: body.error ?? "Login failed." };
  }, [pull, dispatch]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setStatus("guest");
    versionRef.current = 0;
  }, []);

  const syncNow = useCallback(async () => { await push(); }, [push]);

  const refreshUser = useCallback(async () => {
    const { status: code, body } = await api<{ user: AccountUser | null }>("/api/auth/me");
    if (code === 200 && body.user) setUser(body.user);
  }, []);

  return (
    <Ctx.Provider value={{ user, status, register, login, logout, syncNow, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAccount(): AccountCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
