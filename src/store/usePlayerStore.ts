'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

interface PlayerState {
  name: string;
  email: string;
  avatarSeed: string;
  playerKey: string;
  isLoggedIn: boolean;
  hasHydrated: boolean;
}

interface PlayerActions {
  setPlayer: (player: { name: string; email: string; avatarSeed: string }) => void;
  clearPlayer: () => void;
  ensurePlayerKey: () => string;
  setHasHydrated: (value: boolean) => void;
}

function createPlayerKey() {
  return nanoid();
}

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    (set, get) => ({
      name: '',
      email: '',
      avatarSeed: '',
      playerKey: '',
      isLoggedIn: false,
      hasHydrated: false,
      setPlayer: ({ name, email, avatarSeed }) =>
        set((state) => ({
          name,
          email,
          avatarSeed,
          isLoggedIn: true,
          playerKey: state.playerKey || createPlayerKey(),
        })),
      clearPlayer: () =>
        set({
          name: '',
          email: '',
          avatarSeed: '',
          isLoggedIn: false,
          playerKey: '',
        }),
      ensurePlayerKey: () => {
        const existing = get().playerKey;
        if (existing) return existing;
        const next = createPlayerKey();
        set({ playerKey: next });
        return next;
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'chidiya-udd-player',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.isLoggedIn && !state.playerKey) {
          state.ensurePlayerKey();
        }
        state.setHasHydrated(true);
      },
    },
  ),
);
