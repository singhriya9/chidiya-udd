'use client';

export interface PreviewPlayer {
  id: string;
  name: string;
  avatar: string;
  lives: number;
  active: boolean;
  score: number;
}

export interface PreviewGameItem {
  id: string;
  english: string;
  hindi: string;
  flies: boolean;
}

export interface PreviewSpectatorReaction {
  id: string;
  playerId: string;
  emoji: string;
}

export interface SoloPreviewState {
  id: string;
  label: string;
  showAudioGate: boolean;
  audioGateError: string;
  startWithSound: boolean;
  muted: boolean;
  audioEnabled: boolean;
  level: number;
  score: number;
  round: number;
  roundActive: boolean;
  timerMs: number;
  lives: number;
  maxLives: number;
  isFingerUp: boolean;
  shakeTrigger: number;
  activePackId: string | null;
  currentItem: PreviewGameItem | null;
  gameOver: boolean;
}

export interface RoomPreviewState {
  id: string;
  label: string;
  roomId: string;
  audioEnabled: boolean;
  connectionStatus: 'connecting' | 'open' | 'reconnecting' | 'closed';
  gameStarted: boolean;
  players: PreviewPlayer[];
  myId: string;
  currentItem: PreviewGameItem | null;
  timerMs: number;
  round: number;
  roundActive: boolean;
  shakeTrigger: number;
  clickingPlayerIds: string[];
  spectatorReactions: PreviewSpectatorReaction[];
  winner: {
    name: string;
    avatar: string | null;
  } | null;
}

const sampleItems = {
  flying: { id: 'eagle', english: 'Eagle', hindi: 'बाज़', flies: true },
  notFlying: { id: 'table', english: 'Table', hindi: 'मेज', flies: false },
  readyBird: { id: 'parrot', english: 'Parrot', hindi: 'तोता', flies: true },
} satisfies Record<string, PreviewGameItem>;

const fivePlayerRoster: PreviewPlayer[] = [
  {
    id: 'p1',
    name: 'Aarav',
    avatar: 'aarav-host',
    lives: 3,
    active: true,
    score: 4,
  },
  {
    id: 'p2',
    name: 'Kavya',
    avatar: 'kavya-player',
    lives: 2,
    active: true,
    score: 3,
  },
  {
    id: 'p3',
    name: 'Riya',
    avatar: 'riya-player',
    lives: 3,
    active: true,
    score: 2,
  },
  {
    id: 'p4',
    name: 'Ishan',
    avatar: 'ishan-player',
    lives: 1,
    active: true,
    score: 5,
  },
  {
    id: 'p5',
    name: 'Mehul',
    avatar: 'mehul-player',
    lives: 0,
    active: false,
    score: 6,
  },
];

export const soloPreviewStates: SoloPreviewState[] = [
  {
    id: 'audioGate',
    label: 'Audio Gate',
    showAudioGate: true,
    audioGateError: '',
    startWithSound: true,
    muted: false,
    audioEnabled: false,
    level: 1,
    score: 0,
    round: 0,
    roundActive: false,
    timerMs: 3000,
    lives: 5,
    maxLives: 5,
    isFingerUp: false,
    shakeTrigger: 0,
    activePackId: null,
    currentItem: null,
    gameOver: false,
  },
  {
    id: 'ready',
    label: 'Ready State',
    showAudioGate: false,
    audioGateError: '',
    startWithSound: true,
    muted: false,
    audioEnabled: true,
    level: 1,
    score: 0,
    round: 1,
    roundActive: false,
    timerMs: 3000,
    lives: 5,
    maxLives: 5,
    isFingerUp: false,
    shakeTrigger: 0,
    activePackId: 'core',
    currentItem: null,
    gameOver: false,
  },
  {
    id: 'activeRound',
    label: 'Active Round',
    showAudioGate: false,
    audioGateError: '',
    startWithSound: true,
    muted: false,
    audioEnabled: true,
    level: 3,
    score: 14,
    round: 9,
    roundActive: true,
    timerMs: 2000,
    lives: 4,
    maxLives: 5,
    isFingerUp: true,
    shakeTrigger: 0,
    activePackId: 'festival',
    currentItem: sampleItems.flying,
    gameOver: false,
  },
  {
    id: 'muted',
    label: 'Muted + Non Flying',
    showAudioGate: false,
    audioGateError: '',
    startWithSound: false,
    muted: true,
    audioEnabled: false,
    level: 2,
    score: 6,
    round: 5,
    roundActive: true,
    timerMs: 2500,
    lives: 3,
    maxLives: 5,
    isFingerUp: false,
    shakeTrigger: 0,
    activePackId: 'core',
    currentItem: sampleItems.notFlying,
    gameOver: false,
  },
  {
    id: 'lowLives',
    label: 'Low Lives + Shake',
    showAudioGate: false,
    audioGateError: '',
    startWithSound: true,
    muted: false,
    audioEnabled: true,
    level: 4,
    score: 18,
    round: 12,
    roundActive: true,
    timerMs: 1500,
    lives: 1,
    maxLives: 5,
    isFingerUp: false,
    shakeTrigger: 3,
    activePackId: 'festival',
    currentItem: sampleItems.readyBird,
    gameOver: false,
  },
  {
    id: 'gameOver',
    label: 'Game Over',
    showAudioGate: false,
    audioGateError: '',
    startWithSound: true,
    muted: false,
    audioEnabled: true,
    level: 5,
    score: 26,
    round: 17,
    roundActive: false,
    timerMs: 1200,
    lives: 0,
    maxLives: 5,
    isFingerUp: false,
    shakeTrigger: 5,
    activePackId: 'festival',
    currentItem: null,
    gameOver: true,
  },
  {
    id: 'audioError',
    label: 'Audio Error',
    showAudioGate: true,
    audioGateError: 'Could not start solo pack from PartyKit. Please try again.',
    startWithSound: false,
    muted: true,
    audioEnabled: false,
    level: 1,
    score: 0,
    round: 0,
    roundActive: false,
    timerMs: 3000,
    lives: 5,
    maxLives: 5,
    isFingerUp: false,
    shakeTrigger: 0,
    activePackId: null,
    currentItem: null,
    gameOver: false,
  },
];

export const roomPreviewStates: RoomPreviewState[] = [
  {
    id: 'lobby',
    label: 'Lobby (5 Joined)',
    roomId: 'uxedit',
    audioEnabled: true,
    connectionStatus: 'open',
    gameStarted: false,
    players: fivePlayerRoster.map((player) => ({ ...player, active: true, lives: 3 })),
    myId: 'p2',
    currentItem: null,
    timerMs: 3000,
    round: 0,
    roundActive: false,
    shakeTrigger: 0,
    clickingPlayerIds: [],
    spectatorReactions: [],
    winner: null,
  },
  {
    id: 'connecting',
    label: 'Connecting Lobby',
    roomId: 'uxedit',
    audioEnabled: false,
    connectionStatus: 'connecting',
    gameStarted: false,
    players: [],
    myId: 'p2',
    currentItem: null,
    timerMs: 3000,
    round: 0,
    roundActive: false,
    shakeTrigger: 0,
    clickingPlayerIds: [],
    spectatorReactions: [],
    winner: null,
  },
  {
    id: 'activeRound',
    label: 'Live Table (5 Players)',
    roomId: 'uxedit',
    audioEnabled: true,
    connectionStatus: 'open',
    gameStarted: true,
    players: fivePlayerRoster,
    myId: 'p2',
    currentItem: sampleItems.flying,
    timerMs: 1800,
    round: 7,
    roundActive: true,
    shakeTrigger: 0,
    clickingPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    spectatorReactions: [{ id: 'rx-1', playerId: 'p5', emoji: '👏' }],
    winner: null,
  },
  {
    id: 'spectator',
    label: 'Spectator View',
    roomId: 'uxedit',
    audioEnabled: true,
    connectionStatus: 'open',
    gameStarted: true,
    players: fivePlayerRoster,
    myId: 'p5',
    currentItem: sampleItems.notFlying,
    timerMs: 1500,
    round: 10,
    roundActive: true,
    shakeTrigger: 2,
    clickingPlayerIds: ['p1'],
    spectatorReactions: [
      { id: 'rx-2', playerId: 'p5', emoji: '😂' },
      { id: 'rx-3', playerId: 'p5', emoji: '😮' },
    ],
    winner: null,
  },
  {
    id: 'winner',
    label: 'Winner Overlay',
    roomId: 'uxedit',
    audioEnabled: true,
    connectionStatus: 'open',
    gameStarted: false,
    players: fivePlayerRoster.map((player) =>
      player.id === 'p4' ? { ...player, active: true, lives: 1 } : { ...player, active: false, lives: 0 },
    ),
    myId: 'p2',
    currentItem: null,
    timerMs: 1200,
    round: 14,
    roundActive: false,
    shakeTrigger: 0,
    clickingPlayerIds: [],
    spectatorReactions: [],
    winner: {
      name: 'Ishan',
      avatar: 'ishan-player',
    },
  },
];
