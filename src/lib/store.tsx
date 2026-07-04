"use client";

// ─── Client data store ───────────────────────────────────────────────────────
// A single React context backing the whole app. State is persisted to
// localStorage so the demo is fully functional offline and survives reloads.
// In production these actions map 1:1 onto the REST/tRPC API documented in
// docs/API.md — the store is the client-side cache + optimistic layer.

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  AppState, Deck, Flashcard, Note, PlannerTask, Quiz, QuizAttempt, Rating,
  Subject, TutorThread, UserSettings, ChatMessage,
} from "./types";
import { newCardState, reviewCard } from "./fsrs";
import { buildSeedState } from "./seed";
import {
  ACHIEVEMENTS, bumpStreak, emptyDay, newlyUnlocked, XP,
} from "./gamification";
import { isoDate, uid } from "./utils";

const STORAGE_KEY = "cognify.state.v1";
const MAX_VERSIONS = 20;

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "RESET" }
  | { type: "SET_ONBOARDED"; value: boolean }
  | { type: "UPDATE_PROFILE"; patch: Partial<AppState["profile"]> }
  | { type: "UPDATE_SETTINGS"; patch: Partial<UserSettings> }
  // subjects
  | { type: "ADD_SUBJECT"; subject: Subject }
  | { type: "UPDATE_SUBJECT"; id: string; patch: Partial<Subject> }
  | { type: "DELETE_SUBJECT"; id: string }
  // notes
  | { type: "ADD_NOTE"; note: Note }
  | { type: "UPDATE_NOTE"; id: string; patch: Partial<Note>; snapshot?: boolean }
  | { type: "DELETE_NOTE"; id: string }
  // decks + cards
  | { type: "ADD_DECK"; deck: Deck }
  | { type: "UPDATE_DECK"; id: string; patch: Partial<Deck> }
  | { type: "DELETE_DECK"; id: string }
  | { type: "ADD_CARDS"; cards: Flashcard[] }
  | { type: "UPDATE_CARD"; id: string; patch: Partial<Flashcard> }
  | { type: "DELETE_CARD"; id: string }
  | { type: "REVIEW_CARD"; id: string; rating: Rating }
  // quizzes
  | { type: "ADD_QUIZ"; quiz: Quiz }
  | { type: "DELETE_QUIZ"; id: string }
  | { type: "RECORD_ATTEMPT"; attempt: QuizAttempt }
  // planner
  | { type: "ADD_PLANNER_TASKS"; tasks: PlannerTask[]; replaceAuto?: boolean }
  | { type: "TOGGLE_PLANNER_TASK"; id: string }
  | { type: "DELETE_PLANNER_TASK"; id: string }
  // tutor
  | { type: "ADD_THREAD"; thread: TutorThread }
  | { type: "APPEND_MESSAGE"; threadId: string; message: ChatMessage }
  | { type: "UPDATE_LAST_ASSISTANT"; threadId: string; content: string }
  | { type: "DELETE_THREAD"; id: string }
  // gamification
  | { type: "AWARD"; xp?: number; coins?: number }
  | { type: "LOG_ACTIVITY"; patch: Partial<import("./types").DayActivity> };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() {
  return isoDate();
}

function todayActivity(state: AppState): AppState["activity"] {
  const t = today();
  if (state.activity.some((d) => d.date === t)) return state.activity;
  return [...state.activity, emptyDay(t)];
}

function withActivity(
  state: AppState,
  patch: Partial<import("./types").DayActivity>,
): AppState {
  const t = today();
  const activity = todayActivity(state).map((d) =>
    d.date === t
      ? {
          ...d,
          xp: d.xp + (patch.xp ?? 0),
          reviews: d.reviews + (patch.reviews ?? 0),
          reviewsCorrect: d.reviewsCorrect + (patch.reviewsCorrect ?? 0),
          quizQuestions: d.quizQuestions + (patch.quizQuestions ?? 0),
          quizCorrect: d.quizCorrect + (patch.quizCorrect ?? 0),
          studyMinutes: d.studyMinutes + (patch.studyMinutes ?? 0),
          notesEdited: d.notesEdited + (patch.notesEdited ?? 0),
        }
      : d,
  );
  return { ...state, activity };
}

/** Award XP/coins, keep the streak fresh, and unlock any newly-earned badges. */
function award(state: AppState, xp: number, coins = 0): AppState {
  const t = today();
  let next: AppState = {
    ...state,
    game: {
      ...state.game,
      xp: state.game.xp + xp,
      coins: state.game.coins + coins,
      streak: bumpStreak(state.game.streak, t),
    },
  };
  next = withActivity(next, { xp });
  // Evaluate achievements after the state change so conditions see fresh data.
  const unlocked = newlyUnlocked(next);
  if (unlocked.length) {
    const stamp = Date.now();
    const map = { ...next.game.unlocked };
    let bonusCoins = 0;
    unlocked.forEach((a) => {
      map[a.id] = stamp;
      bonusCoins += a.coins;
    });
    next = {
      ...next,
      game: { ...next.game, unlocked: map, coins: next.game.coins + bonusCoins },
      _justUnlocked: unlocked.map((a) => a.id),
    } as AppState & { _justUnlocked: string[] };
  }
  return next;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "RESET":
      return buildSeedState(state.profile.name, state.profile.email);
    case "SET_ONBOARDED":
      return { ...state, onboarded: action.value };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        profile: { ...state.profile, settings: { ...state.profile.settings, ...action.patch } },
      };

    case "ADD_SUBJECT":
      return { ...state, subjects: [action.subject, ...state.subjects] };
    case "UPDATE_SUBJECT":
      return {
        ...state,
        subjects: state.subjects.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      };
    case "DELETE_SUBJECT": {
      const deckIds = new Set(state.decks.filter((d) => d.subjectId === action.id).map((d) => d.id));
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.id),
        decks: state.decks.filter((d) => d.subjectId !== action.id),
        cards: state.cards.filter((c) => !deckIds.has(c.deckId)),
        notes: state.notes.filter((n) => n.subjectId !== action.id),
        quizzes: state.quizzes.filter((q) => q.subjectId !== action.id),
      };
    }

    case "ADD_NOTE": {
      let s: AppState = { ...state, notes: [action.note, ...state.notes] };
      s = withActivity(s, { notesEdited: 1 });
      s = award(s, XP.noteCreated);
      return s;
    }
    case "UPDATE_NOTE": {
      const notes = state.notes.map((n) => {
        if (n.id !== action.id) return n;
        const versions = action.snapshot
          ? [{ savedAt: n.updatedAt, content: n.content }, ...n.versions].slice(0, MAX_VERSIONS)
          : n.versions;
        return { ...n, ...action.patch, updatedAt: Date.now(), versions };
      });
      return { ...state, notes };
    }
    case "DELETE_NOTE":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };

    case "ADD_DECK":
      return award({ ...state, decks: [action.deck, ...state.decks] }, XP.deckCreated);
    case "UPDATE_DECK":
      return {
        ...state,
        decks: state.decks.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      };
    case "DELETE_DECK":
      return {
        ...state,
        decks: state.decks.filter((d) => d.id !== action.id),
        cards: state.cards.filter((c) => c.deckId !== action.id),
      };
    case "ADD_CARDS":
      return { ...state, cards: [...action.cards, ...state.cards] };
    case "UPDATE_CARD":
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };
    case "DELETE_CARD":
      return { ...state, cards: state.cards.filter((c) => c.id !== action.id) };

    case "REVIEW_CARD": {
      const card = state.cards.find((c) => c.id === action.id);
      if (!card) return state;
      const retention = state.profile.settings.desiredRetention;
      const { next, elapsedDays } = reviewCard(card.srs, action.rating, retention);
      const correct = action.rating >= 3;
      const updated: Flashcard = {
        ...card,
        srs: next,
        history: [...card.history, { at: Date.now(), rating: action.rating, elapsedDays }].slice(-50),
      };
      let s: AppState = {
        ...state,
        cards: state.cards.map((c) => (c.id === card.id ? updated : c)),
      };
      s = withActivity(s, { reviews: 1, reviewsCorrect: correct ? 1 : 0 });
      s = award(s, correct ? XP.reviewCardCorrect : XP.reviewCard);
      return s;
    }

    case "ADD_QUIZ":
      return { ...state, quizzes: [action.quiz, ...state.quizzes] };
    case "DELETE_QUIZ":
      return {
        ...state,
        quizzes: state.quizzes.filter((q) => q.id !== action.id),
        attempts: state.attempts.filter((a) => a.quizId !== action.id),
      };
    case "RECORD_ATTEMPT": {
      const a = action.attempt;
      const correct = a.answers.filter((x) => x.correct).length;
      let s: AppState = { ...state, attempts: [a, ...state.attempts] };
      s = withActivity(s, { quizQuestions: a.answers.length, quizCorrect: correct });
      const base = a.mode === "exam" ? XP.examCompleted : XP.quizCompleted;
      s = award(s, base + correct * XP.quizQuestionCorrect);
      return s;
    }

    case "ADD_PLANNER_TASKS": {
      const planner = action.replaceAuto
        ? state.planner.filter((t) => !t.auto)
        : state.planner;
      return { ...state, planner: [...planner, ...action.tasks] };
    }
    case "TOGGLE_PLANNER_TASK": {
      const task = state.planner.find((t) => t.id === action.id);
      if (!task) return state;
      const nowDone = !task.done;
      const planner = state.planner.map((t) => (t.id === action.id ? { ...t, done: nowDone } : t));
      let s: AppState = { ...state, planner };
      if (nowDone) s = award(s, XP.plannerTaskDone);
      if (nowDone && task.kind === "study") s = withActivity(s, { studyMinutes: task.durationMin });
      return s;
    }
    case "DELETE_PLANNER_TASK":
      return { ...state, planner: state.planner.filter((t) => t.id !== action.id) };

    case "ADD_THREAD":
      return { ...state, threads: [action.thread, ...state.threads] };
    case "APPEND_MESSAGE": {
      const threads = state.threads.map((t) =>
        t.id === action.threadId
          ? { ...t, messages: [...t.messages, action.message], updatedAt: Date.now() }
          : t,
      );
      let s: AppState = { ...state, threads };
      if (action.message.role === "user") s = award(s, XP.tutorSession);
      return s;
    }
    case "UPDATE_LAST_ASSISTANT": {
      const threads = state.threads.map((t) => {
        if (t.id !== action.threadId) return t;
        const messages = [...t.messages];
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === "assistant") {
            messages[i] = { ...messages[i], content: action.content };
            break;
          }
        }
        return { ...t, messages, updatedAt: Date.now() };
      });
      return { ...state, threads };
    }
    case "DELETE_THREAD":
      return { ...state, threads: state.threads.filter((t) => t.id !== action.id) };

    case "AWARD":
      return award(state, action.xp ?? 0, action.coins ?? 0);
    case "LOG_ACTIVITY":
      return withActivity(state, action.patch);

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  ready: boolean;
  /** Ids of achievements unlocked by the most recent action (for toasts). */
  justUnlocked: string[];
  clearUnlocked: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null as unknown as AppState, () => buildSeedState());
  const [ready, setReady] = React.useState(false);
  const [justUnlocked, setJustUnlocked] = React.useState<string[]>([]);
  const firstLoad = useRef(true);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && parsed.version === 1) dispatch({ type: "HYDRATE", state: parsed });
      }
    } catch {
      /* ignore corrupt state — fall back to seed */
    }
    setReady(true);
  }, []);

  // Persist on every change (after initial hydration).
  useEffect(() => {
    if (!ready) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    try {
      const { _justUnlocked, ...clean } = state as AppState & { _justUnlocked?: string[] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      if (_justUnlocked && _justUnlocked.length) setJustUnlocked(_justUnlocked);
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [state, ready]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      dispatch,
      ready,
      justUnlocked,
      clearUnlocked: () => setJustUnlocked([]),
    }),
    [state, ready, justUnlocked],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// ─── Convenience action creators ─────────────────────────────────────────────

export const actions = {
  newSubject(patch: Partial<Subject> & { name: string }): Subject {
    return {
      id: uid("subj"),
      name: patch.name,
      emoji: patch.emoji ?? "📚",
      color: patch.color ?? "indigo",
      examDate: patch.examDate,
      goal: patch.goal,
      pinned: patch.pinned ?? false,
      archived: false,
      createdAt: Date.now(),
    };
  },
  newNote(patch: Partial<Note> & { title: string }): Note {
    const now = Date.now();
    return {
      id: uid("note"),
      subjectId: patch.subjectId ?? null,
      title: patch.title,
      content: patch.content ?? "",
      tags: patch.tags ?? [],
      pinned: patch.pinned ?? false,
      createdAt: now,
      updatedAt: now,
      versions: [],
    };
  },
  newDeck(patch: Partial<Deck> & { name: string }): Deck {
    return {
      id: uid("deck"),
      subjectId: patch.subjectId ?? null,
      name: patch.name,
      emoji: patch.emoji ?? "🗂️",
      description: patch.description ?? "",
      createdAt: Date.now(),
    };
  },
  newCard(deckId: string, patch: Partial<Flashcard> & { front: string; back: string }): Flashcard {
    return {
      id: uid("card"),
      deckId,
      kind: patch.kind ?? "basic",
      front: patch.front,
      back: patch.back,
      options: patch.options,
      answerIndex: patch.answerIndex,
      tags: patch.tags ?? [],
      createdAt: Date.now(),
      srs: newCardState(),
      history: [],
    };
  },
};

export { ACHIEVEMENTS };
