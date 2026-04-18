'use client';

import { create } from 'zustand';

export interface GameItem {
  id: string;
  english: string;
  hindi: string;
  flies: boolean;
}

interface GameState {
  lives: number;
  score: number;
  level: number;
  currentItem: GameItem | null;
  isPlaying: boolean;
  gameOver: boolean;
  shakeTrigger: number; // increment to trigger shake
  maxLives: number;
}

interface GameActions {
  loseLife: () => void;
  addScore: () => void;
  nextLevel: () => void;
  setItem: (item: GameItem) => void;
  startGame: (maxLives?: number) => void;
  endGame: () => void;
  triggerShake: () => void;
  reset: (maxLives?: number) => void;
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  lives: 5,
  score: 0,
  level: 1,
  currentItem: null,
  isPlaying: false,
  gameOver: false,
  shakeTrigger: 0,
  maxLives: 5,

  loseLife: () =>
    set((state) => {
      const newLives = state.lives - 1;
      return {
        lives: newLives,
        gameOver: newLives <= 0,
        isPlaying: newLives > 0,
        shakeTrigger: state.shakeTrigger + 1,
      };
    }),

  addScore: () => set((state) => ({ score: state.score + 1 })),

  nextLevel: () => set((state) => ({ level: state.level + 1 })),

  setItem: (item) => set({ currentItem: item }),

  startGame: (maxLives = 5) =>
    set({ isPlaying: true, gameOver: false, lives: maxLives, maxLives, score: 0, level: 1, currentItem: null }),

  endGame: () => set({ isPlaying: false, gameOver: true }),

  triggerShake: () => set((state) => ({ shakeTrigger: state.shakeTrigger + 1 })),

  reset: (maxLives = 5) =>
    set({ lives: maxLives, maxLives, score: 0, level: 1, currentItem: null, isPlaying: false, gameOver: false, shakeTrigger: 0 }),
}));
