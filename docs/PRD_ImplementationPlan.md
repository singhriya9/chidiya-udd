# Chidiya Udd — Product Requirements Document & Implementation Plan

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Tech Stack](#tech-stack)
3. [Feature Specifications](#feature-specifications)
4. [Database Schema](#database-schema)
5. [Game Logic & Architecture](#game-logic--architecture)
6. [Implementation Plan — Day-by-Day](#implementation-plan)

---

## Product Overview

**Chidiya Udd** is a real-time reaction-based multiplayer web game inspired by the classic Indian children's game. Players must react within a shrinking time window to decide whether the called object "flies" (udd) or not. A wrong click or a missed flying object costs a life. Last person standing wins. Multiplayer matches lock to one randomly selected item pack for the full game, and the leaderboard uses Bayesian scoring from total correct reactions and games played.

### Two Modes

| Mode        | Description                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solo        | Play against the computer. 5 lives. Timer shrinks with each level.                                                                                                      |
| Multiplayer | Create/join a room. 3 lives. Poker-style landscape view. Last man standing wins. Item packs are selected once per match and then played randomly from within that pack. |

---

## Tech Stack

### Infrastructure

| Layer              | Technology                 | Purpose                            |
| ------------------ | -------------------------- | ---------------------------------- |
| Frontend Framework | Next.js 16 (App Router)    | Core framework, routing, SSR       |
| Frontend Host      | Vercel                     | Deploy Next.js app                 |
| Real-Time Server   | PartyKit (Cloudflare Edge) | WebSocket rooms, game ticks, timer |
| Database           | Neon.tech (PostgreSQL)     | Persistent leaderboard storage     |
| ORM                | Drizzle ORM                | Type-safe DB queries               |

### UI & Styling

| Library                                              | Purpose                                              |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Tailwind CSS                                         | Utility-first styling                                |
| shadcn/ui                                            | Pre-built UI components (lobby, modals, leaderboard) |
| Framer Motion                                        | Game animations (timer bar, red blink, flying items) |
| Lucide React                                         | Icons                                                |
| DiceBear (`@dicebear/core` + `@dicebear/collection`) | Auto-generated player avatars                        |

### Game UX & Audio

| Library         | Purpose                            |
| --------------- | ---------------------------------- |
| Howler.js       | Audio sprite playback engine       |
| ElevenLabs API  | Pre-generate all voice audio files |
| canvas-confetti | Victory celebration effect         |

### State & Utilities

| Library                     | Purpose                                                     |
| --------------------------- | ----------------------------------------------------------- |
| Zustand                     | Client-side game state (lives, score, timer)                |
| partysocket                 | Official PartyKit client hook for Next.js                   |
| nanoid                      | Generate unique shareable room codes(6 character alphanum ) |
| tailwind-merge + clsx       | Dynamic class merging                                       |
| drizzle orm with postgresql | Neon DB Postgresql (used by Drizzle)                        |

---

## Feature Specifications

### 1. Onboarding Screen

- No password. No OAuth.
- Session resume order:
  1. Try localStorage (`name`, `email`, `avatar`).
  2. If localStorage missing/cleared, ask only email first.
  3. If email exists in DB, hydrate player with stored `name` + `avatar`.
  4. If email is not found, ask name and create user with a DiceBear avatar.
- DiceBear avatar is generated once on first registration and persisted in backend.
- LocalStorage mirrors backend player profile for quick re-entry.

### 2. Home Screen

- Play Solo button
- Create Room button
- Join Room (via URL or 6-char code)
- View Leaderboard button

### 3. Solo Mode

- 5 lives
- Items called one at a time with audio ("Chidiya Udd!", "Table Udd!")
- Display item name in English + Hindi only (no item emojis/icons)
- 3-second shrinking timer bar (Framer Motion)
- Timer shrinks per level: `3s → 2.5s → 2s → 1.5s → 1s`
- Before game starts, ask for website audio permission/unmute interaction.
- Wrong click OR missed flying item = 1 life lost
- Visual table behavior (solo): circular center table with one finger indicator slightly below the table edge; on UDD click finger animates upward slightly.
- On UDD click: haptic feedback using `window.navigator.vibrate([50])`.
- On life loss: double haptic feedback `window.navigator.vibrate([100, 50, 100])`.
- Red screen blink on life loss (Framer Motion) + whole-table x-axis shake.
- Score tracked per correct reaction
- Game over screen with final score + Play Again + confetti
- Round order rule: first round is always `chidiya_udd`, then random items.

### 4. Multiplayer Mode

**Room Creation:**

- Host clicks "Create Room"
- nanoid generates a 6-char code (e.g., `kx9-f3a`)
- Shareable URL: `chidiya-udd/vercel.app/room/kx9-f3a`
- Room waits in lobby until host clicks "Start Game"

**In-Game (Landscape Table Layout):**

- Before multiplayer game starts:
  - ask for website audio permission/unmute interaction,
  - show rotate-to-landscape prompt on portrait devices.
- Center table shape: rectangular in multiplayer mode.
- Player avatars arranged around the center table, each with finger indicator slightly below their table edge position.
- Each player shown with: DiceBear avatar + name + 3 life indicators (hearts)
- Central area shows current item name in English + Hindi (no item emoji/icon)
- "UDD" button — large, accessible (bottom center or split sides for thumb reach on mobile)
- When someone clicks UDD, all players see that player's finger move slightly upward.
- In multiplayer, when another player clicks UDD, play a subtle positional "ghost tap" sound near that player's table position.
- Wrong reaction: that player's lives drop + red blink on their card + table shake, visible to everyone in room.
- Almost-dead state: when a player has 1 life left, their avatar card gets pulse/vignette glow to draw focus.
- Eliminated players: avatar turns grayscale(but he can see the game going in the room)
- Spectator reactions for eliminated players: lightweight reaction buttons (e.g., "😂", "😮"); reactions float up from that avatar and fade out.
- Last player standing wins
- Winners screen: canvas-confetti + winner's name
- "Play Again" in same room — resets lives, everyone stays

**Real-time Sync:**

- PartyKit server is the sole source of truth
- At game start, PartyKit selects one random pack from `party/pack1.json` through `party/pack6.json`
- Each round then picks a random item from that selected pack
- Server picks random item, determines flies/not, emits to ALL players simultaneously
- Server evaluates each player's response (correct/wrong) and updates game state
- Server broadcasts updated state to all clients

### 5. Leaderboard

- Next.js Server Component (SSR)
- Shows top 20 players by Bayesian score
- Each row: DiceBear avatar + Name + Total Correct + Games Played
- Sorted by Bayesian score descending, using a smoothed rank derived from total correct reactions and games played

### 6. Table & Interaction Visual Rules

- Solo mode table: circular table in center.
- Multiplayer mode table: rectangular table in center.
- Finger indicators default to slightly downward/rest position.
- On every UDD click, clicked finger animates to a slightly raised position and then returns.
- Lives (hearts) and red-blink penalties are synchronized and visible across all clients in multiplayer.
- On life loss, apply short high-frequency x-axis shake animation to whole table container.
- On 1 life remaining, apply pulsing/vignette danger style to player card.
- Spectator reactions originate from eliminated player's card and animate upward with fade-out.

---

## Database Schema

```sql
-- Users table
users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  avatar     TEXT NOT NULL,
  total_correct INTEGER DEFAULT 0,
  games_played  INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
)
```

**Drizzle Schema (`src/db/schema.ts`):**

```typescript
import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  avatar: text("avatar").notNull(),
  totalCorrect: integer("total_correct").default(0),
  gamesPlayed: integer("games_played").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## Game Logic & Architecture

### Items JSON (`party/items.json`)

```json
[
  {
    "id": "chidiya_udd",
    "english": "Chidiya",
    "hindi": "चिड़िया",
    "flies": true
  },
  { "id": "maina_udd", "english": "Maina", "hindi": "मैना", "flies": true },
  { "id": "tota_udd", "english": "Tota", "hindi": "तोता", "flies": true },
  {
    "id": "kabootar_udd",
    "english": "Kabootar",
    "hindi": "कबूतर",
    "flies": true
  },
  { "id": "baaz_udd", "english": "Baaz", "hindi": "बाज़", "flies": true },
  { "id": "titli_udd", "english": "Titli", "hindi": "तितली", "flies": true },
  { "id": "makhi_udd", "english": "Makhi", "hindi": "मक्खी", "flies": true },
  { "id": "eagle_udd", "english": "Eagle", "hindi": "ईगल", "flies": true },
  {
    "id": "aeroplane_udd",
    "english": "Aeroplane",
    "hindi": "हवाई जहाज़",
    "flies": true
  },
  {
    "id": "helicopter_udd",
    "english": "Helicopter",
    "hindi": "हेलिकॉप्टर",
    "flies": true
  },
  { "id": "rocket_udd", "english": "Rocket", "hindi": "रॉकेट", "flies": true },
  { "id": "patang_udd", "english": "Patang", "hindi": "पतंग", "flies": true },
  { "id": "drone_udd", "english": "Drone", "hindi": "ड्रोन", "flies": true },
  {
    "id": "balloon_udd",
    "english": "Balloon",
    "hindi": "गुब्बारा",
    "flies": true
  },
  { "id": "bandar_udd", "english": "Bandar", "hindi": "बंदर", "flies": false },
  { "id": "hathi_udd", "english": "Hathi", "hindi": "हाथी", "flies": false },
  { "id": "sher_udd", "english": "Sher", "hindi": "शेर", "flies": false },
  { "id": "kutta_udd", "english": "Kutta", "hindi": "कुत्ता", "flies": false },
  { "id": "billi_udd", "english": "Billi", "hindi": "बिल्ली", "flies": false },
  { "id": "ghoda_udd", "english": "Ghoda", "hindi": "घोड़ा", "flies": false },
  { "id": "mez_udd", "english": "Mez", "hindi": "मेज", "flies": false },
  { "id": "kursi_udd", "english": "Kursi", "hindi": "कुर्सी", "flies": false },
  {
    "id": "mobile_udd",
    "english": "Mobile",
    "hindi": "मोबाइल",
    "flies": false
  },
  {
    "id": "laptop_udd",
    "english": "Laptop",
    "hindi": "लैपटॉप",
    "flies": false
  },
  { "id": "balti_udd", "english": "Balti", "hindi": "बाल्टी", "flies": false },
  { "id": "joota_udd", "english": "Joota", "hindi": "जूता", "flies": false },
  { "id": "cycle_udd", "english": "Cycle", "hindi": "साइकिल", "flies": false },
  { "id": "fridge_udd", "english": "Fridge", "hindi": "फ्रिज", "flies": false },
  {
    "id": "almirah_udd",
    "english": "Almirah",
    "hindi": "अलमारी",
    "flies": false
  },
  { "id": "gaadi_udd", "english": "Gaadi", "hindi": "गाड़ी", "flies": false }
]
```

### PartyKit Server Message Types

```typescript
// Server → Clients
type ServerMessage =
  | { type: "PLAYER_JOINED"; players: Player[] }
  | { type: "GAME_STARTED" }
  | { type: "NEW_ITEM"; item: Item; timerMs: number; round: number }
  | { type: "PLAYER_ACTION"; playerId: string; correct: boolean }
  | { type: "LIVES_UPDATE"; playerId: string; lives: number }
  | { type: "PLAYER_OUT"; playerId: string }
  | { type: "GAME_OVER"; winnerId: string; winnerName: string }
  | { type: "ROOM_RESET" };

// Client → Server
type ClientMessage =
  | { type: "UDD_CLICKED"; timestamp: number }
  | { type: "START_GAME" }
  | { type: "PLAY_AGAIN" };
```

---

## Implementation Plan

---

## DAY 1 — Foundation, Setup & Audio Pipeline

### Phase 1.1 — Project Scaffolding (1–2 hours)

**Step 1:** Bootstrap the Next.js project

```bash
npx create-next-app@latest chidiya-udd \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd chidiya-udd
```

**Step 2:** Install all dependencies at once

```bash
# UI
npm install framer-motion lucide-react class-variance-authority clsx tailwind-merge
npx shadcn@latest init
npx shadcn@latest add button input card dialog badge

# Game UX
npm install howler @types/howler canvas-confetti @types/canvas-confetti
npm install @dicebear/core @dicebear/collection

# State & Sockets
npm install zustand partysocket nanoid

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

**Step 3:** Install PartyKit CLI

```bash
npm install -D partykit
```

**Step 4:** Create project folder structure

```
chidiya-udd/
├── party/
│   ├── server.ts         ← PartyKit WebSocket server
│   └── items.json        ← All 30 game items
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← Landing / Name+Email
│   │   ├── room/[id]/page.tsx   ← Multiplayer room
│   │   ├── solo/page.tsx        ← Solo mode
│   │   └── leaderboard/page.tsx ← Leaderboard
│   ├── components/
│   │   ├── ui/                  ← shadcn components
│   │   ├── game/                ← Timer, UddButton, ItemDisplay
│   │   ├── lobby/               ← IdentityGate, RoomCard
│   │   └── leaderboard/         ← LeaderboardTable
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── store/
│   │   ├── usePlayerStore.ts    ← Name, email, avatar
│   │   └── useGameStore.ts      ← Lives, score, timer state
│   └── lib/
│       ├── audio.ts             ← Howler sprite init
│       └── avatar.ts            ← DiceBear helper
├── public/
│   └── sounds/
│       ├── chidiya_sprite.mp3
│       └── chidiya_sprite.json
├── partykit.json
├── drizzle.config.ts
└── .env
```

---

### Phase 1.2 — Database Setup (30 mins)

**Step 1:** Go to neon.tech → Create new project → Copy connection string

**Step 2:** Create `.env`

```
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_PARTYKIT_HOST="localhost:1999"
```

**Step 3:** Write `src/db/schema.ts` (see schema above)

**Step 4:** Write `src/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Step 5:** Write `drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Step 6:** Run migration

```bash
npx drizzle-kit push
```

---

### Phase 1.3 — Audio Pipeline (2–3 hours)

**Step 1:** Sign up at elevenlabs.io → Get free API key

**Step 2:** Choose a voice — pick one that sounds energetic and clear. Note the Voice ID from the dashboard.

**Step 3:** Create `scripts/generate-audio.js` in root:

```javascript
const fs = require("fs");
const path = require("path");

const VOICE_ID = "YOUR_VOICE_ID_HERE";
const API_KEY = "YOUR_ELEVENLABS_KEY_HERE";
const OUT_DIR = "./raw-sounds";

const phrases = [
  "chidiya_udd",
  "maina_udd",
  "tota_udd",
  "kabootar_udd",
  "baaz_udd",
  "titli_udd",
  "makhi_udd",
  "eagle_udd",
  "aeroplane_udd",
  "helicopter_udd",
  "rocket_udd",
  "patang_udd",
  "drone_udd",
  "balloon_udd",
  "bandar_udd",
  "hathi_udd",
  "sher_udd",
  "kutta_udd",
  "billi_udd",
  "ghoda_udd",
  "mez_udd",
  "kursi_udd",
  "mobile_udd",
  "laptop_udd",
  "balti_udd",
  "joota_udd",
  "cycle_udd",
  "fridge_udd",
  "almirah_udd",
  "gaadi_udd",
];

// Convert id like "chidiya_udd" → spoken text "Chidiya... Udd!"
const toSpeech = (id) => {
  const word = id.replace("_udd", "");
  return `${word.charAt(0).toUpperCase() + word.slice(1)}... Udd!`;
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

async function generate() {
  for (const phrase of phrases) {
    const text = toSpeech(phrase);
    console.log(`Generating: ${text}`);
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        }),
      },
    );
    if (!res.ok) {
      console.error(`Failed: ${phrase}`, await res.text());
      continue;
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(path.join(OUT_DIR, `${phrase}.mp3`), Buffer.from(buffer));
    console.log(`  ✓ Saved ${phrase}.mp3`);
    await new Promise((r) => setTimeout(r, 300)); // rate limit buffer
  }
  console.log("All done!");
}

generate();
```

**Step 4:** Also generate SFX sounds manually or via script:

- `correct.mp3` — short happy ding
- `wrong.mp3` — buzzer / fail sound
- `win.mp3` — short fanfare
- `lose.mp3` — sad trombone

Use freesound.org (free, no attribution required if CC0).

**Step 5:** Run the generation script

```bash
node scripts/generate-audio.js
```

You'll have 30+ .mp3 files in `/raw-sounds`.

**Step 6:** Install audiosprite and FFmpeg

```bash
npm install -g audiosprite
# Mac: brew install ffmpeg
# Windows: download from ffmpeg.org
```

**Step 7:** Generate the sprite

```bash
cd raw-sounds
audiosprite --format howler --export mp3 --output ../public/sounds/chidiya_sprite *.mp3
cd ..
```

This creates `public/sounds/chidiya_sprite.mp3` and `public/sounds/chidiya_sprite.json`.

**Step 8:** Create `src/lib/audio.ts`

```typescript
import { Howl } from "howler";

let soundEngine: Howl | null = null;

export async function initAudio() {
  const spriteData = await fetch("/sounds/chidiya_sprite.json").then((r) =>
    r.json(),
  );
  soundEngine = new Howl({
    src: ["/sounds/chidiya_sprite.mp3"],
    sprite: spriteData.sprite,
    html5: true,
  });
}

export function playSound(id: string) {
  soundEngine?.play(id);
}
```

---

## DAY 2 — Core Game UI & Solo Mode

### Phase 2.1 — Onboarding & Home Screen (1.5 hours)

**Step 1:** Create `src/store/usePlayerStore.ts` with Zustand

- Fields: `name`, `email`, `avatarSeed`
- Actions: `setPlayer`, `clearPlayer`
- Persist to localStorage

**Step 2:** Create `src/lib/avatar.ts` (backend-saved avatar string)

```typescript
import { createAvatar } from "@dicebear/core";
import { micah } from "@dicebear/collection";

export function getAvatarSvg(seed: string): string {
  return createAvatar(micah, { seed, size: 64 }).toString();
}
```

**Step 3:** Build `src/components/lobby/IdentityGate.tsx`

- First step: email-only input.
- Call backend `lookupPlayerByEmail(email)`.
- If found: set store from backend (`name`, `email`, `avatar`) and continue.
- If not found: show name field, generate DiceBear avatar, call `registerPlayer`.
- Save resolved player profile to localStorage.

**Step 4:** Build `src/app/page.tsx` — Landing Page

- If local profile not available → show `<IdentityGate />`
- If name set → show Home with 4 options:
  - Play Solo
  - Create Room
  - Join Room (input for code)
  - Leaderboard
- Show player's avatar + name in top corner

---

### Phase 2.2 — Game Core Components (2 hours)

**Step 1:** Build `src/components/game/TimerBar.tsx`

- Framer Motion `motion.div` with `animate={{ width: '0%' }}`
- `transition={{ duration: timerMs / 1000, ease: 'linear' }}`
- Color: green → yellow → red as it shrinks
- Re-key with `key={round}` to restart animation each round

**Step 2:** Build `src/components/game/ItemDisplay.tsx`

- Shows item name in English + Hindi
- No emoji/icon rendering for items
- Framer Motion: item "flies in" from top when called, then fades
- `animate={{ y: [-100, 0], opacity: [0, 1] }}`

**Step 3:** Build `src/components/game/UddButton.tsx`

- Giant button — takes up significant screen space
- Framer Motion: scale up on press (`whileTap={{ scale: 0.95 }}`)
- On press: emit action to game engine (callback prop)
- Disabled briefly after press to prevent spam-clicking
- Trigger haptic tap on valid press: `navigator.vibrate?.([50])`

**Step 4:** Build `src/components/game/LivesDisplay.tsx`

- Shows 3 or 5 heart icons (Lucide `Heart` icon)
- When a life is lost: heart turns grey + Framer Motion scale animation
- Red screen flash overlay (full-screen red div, `opacity: [0.5, 0]` over 0.6s)
- On life loss: trigger `navigator.vibrate?.([100, 50, 100])`
- Expose `danger` state when lives === 1 for avatar pulse/vignette styling

**Step 5:** Build `src/components/game/TableShell.tsx`

- Shared wrapper for solo/multiplayer table visuals
- Handles life-loss shake animation (`x` oscillation over ~300–450ms)
- Supports `shape="circle" | "rectangle"` per mode

---

### Phase 2.3 — Solo Mode (2–3 hours)

**Step 1:** Create `src/store/useGameStore.ts` with Zustand

- `lives`, `score`, `level`, `currentItem`, `isPlaying`, `gameOver`
- Actions: `loseLife`, `addScore`, `nextLevel`, `reset`

**Step 2:** Build the Solo game engine in `src/app/solo/page.tsx`

**Game Loop Logic (client-side for solo):**

```typescript
// Timer per level (in ms)
const TIMERS = [3000, 2500, 2000, 1500, 1200, 1000];

function getTimer(level: number) {
  return TIMERS[Math.min(level, TIMERS.length - 1)];
}

// Each round:
// 1. Round 1 always uses chidiya_udd
// 2. Round 2 onward picks random item from items.json
// 2. Play audio via Howler
// 3. Start countdown timer
// 4. If timer expires:
//    - item.flies === true AND user did NOT click → lose life
//    - item.flies === false AND user did NOT click → correct (no action needed)
// 5. If user clicks UDD:
//    - item.flies === true → correct + add score
//    - item.flies === false → lose life
// 6. After evaluation: 0.8s pause → next round
```

**Step 3:** Wire up all components on solo page:

- `<ItemDisplay />` — shows current item
- `<TimerBar />` — countdown
- `<LivesDisplay />` — 5 hearts
- `<UddButton />` — player action
- Score counter top-right
- Level indicator

**Step 4:** Game Over screen

- Show score + level reached
- "Play Again" button resets store
- "View Leaderboard" button
- Save score to Neon via Server Action on game end

---

## DAY 3 — Multiplayer, Leaderboard & Deployment

### Phase 3.1 — PartyKit Server (2–3 hours)

**Step 1:** Create `partykit.json` in project root

```json
{
  "name": "chidiya-udd-server",
  "main": "party/server.ts",
  "compatibilityDate": "2024-01-01"
}
```

**Step 2:** Create `party/items.json` (use the 30 items listed above)

- Keep schema as: `id`, `english`, `hindi`, `flies`
- Do not include emoji field.
- Store the six pack files separately and select one pack per match so rounds stay consistent inside a game.

**Step 3:** Build `party/server.ts` — the complete game server

```typescript
import type * as Party from "partykit/server";
import items from "./items.json";

interface Player {
  id: string;
  name: string;
  lives: number;
  score: number;
  active: boolean;
}

export default class ChidiyaUddServer implements Party.Server {
  players: Map<string, Player> = new Map();
  gameActive = false;
  currentTimer: ReturnType<typeof setTimeout> | null = null;
  roundTimer = 3000;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.send(JSON.stringify({ type: "CONNECTED", id: conn.id }));
    this.broadcastPlayers();
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);

    if (data.type === "JOIN") {
      this.players.set(sender.id, {
        id: sender.id,
        name: data.name,
        lives: 3,
        score: 0,
        active: true,
      });
      this.broadcastPlayers();
    }

    if (data.type === "START_GAME" && !this.gameActive) {
      this.gameActive = true;
      this.roundTimer = 3000;
      this.room.broadcast(JSON.stringify({ type: "GAME_STARTED" }));
      setTimeout(() => this.newRound(), 1000);
    }

    if (data.type === "UDD_CLICKED") {
      this.handleUddClick(sender.id);
    }

    if (data.type === "PLAY_AGAIN") {
      this.resetGame();
    }
  }

  newRound() {
    if (!this.gameActive) return;
    const item = items[Math.floor(Math.random() * items.length)];
    this.currentItem = item;
    this.roundResponses = new Map();

    this.room.broadcast(
      JSON.stringify({
        type: "NEW_ITEM",
        item,
        timerMs: this.roundTimer,
      }),
    );

    this.currentTimer = setTimeout(() => this.evaluateRound(), this.roundTimer);
  }

  handleUddClick(playerId: string) {
    if (!this.currentItem || this.roundResponses.has(playerId)) return;
    this.roundResponses.set(playerId, { clicked: true, timestamp: Date.now() });
    this.room.broadcast(JSON.stringify({ type: "PLAYER_ACTION", playerId }));
  }

  evaluateRound() {
    const activePlayers = [...this.players.values()].filter((p) => p.active);

    for (const player of activePlayers) {
      const clicked = this.roundResponses.has(player.id);
      const shouldClick = this.currentItem!.flies;
      const wrong = (clicked && !shouldClick) || (!clicked && shouldClick);

      if (wrong) {
        player.lives--;
        this.room.broadcast(
          JSON.stringify({
            type: "LIVES_UPDATE",
            playerId: player.id,
            lives: player.lives,
          }),
        );
        if (player.lives <= 0) {
          player.active = false;
          this.room.broadcast(
            JSON.stringify({ type: "PLAYER_OUT", playerId: player.id }),
          );
        }
      } else if (clicked && shouldClick) {
        player.score++;
      }
    }

    const remaining = [...this.players.values()].filter((p) => p.active);
    if (remaining.length <= 1) {
      const winner = remaining[0];
      this.gameActive = false;
      this.room.broadcast(
        JSON.stringify({
          type: "GAME_OVER",
          winnerId: winner?.id,
          winnerName: winner?.name,
        }),
      );
      return;
    }

    // Speed up slightly each round
    this.roundTimer = Math.max(1000, this.roundTimer - 50);
    setTimeout(() => this.newRound(), 1200);
  }

  broadcastPlayers() {
    this.room.broadcast(
      JSON.stringify({
        type: "PLAYER_JOINED",
        players: [...this.players.values()],
      }),
    );
  }

  resetGame() {
    this.players.forEach((p) => {
      p.lives = 3;
      p.score = 0;
      p.active = true;
    });
    this.gameActive = false;
    this.roundTimer = 3000;
    this.room.broadcast(JSON.stringify({ type: "ROOM_RESET" }));
    this.broadcastPlayers();
  }
}
```

**Step 4:** Test locally

```bash
npx partykit dev
# PartyKit runs on localhost:1999 alongside Next.js on localhost:3000
```

---

### Phase 3.2 — Multiplayer Room UI (2 hours)

**Step 1:** Create `src/app/room/[id]/page.tsx`

- Read `params.id` as the room code
- Render Lobby if game hasn't started
- Render Game when `GAME_STARTED` is received

**Step 2:** Build `src/components/lobby/RoomLobby.tsx`

- Shows room code + shareable URL with copy button
- Lists all players who have joined with their avatars
- Host sees "Start Game" button; others see "Waiting for host..."
- Gate start with "Enable Audio" user gesture
- Show rotate-device hint until landscape on mobile

**Step 3:** Build `src/components/game/GameTable.tsx` — Mode-Aware Layout

```
Solo:
      ( circular center table )
            player finger (down -> up on UDD)

Multiplayer:
┌─────────────────────────────────────────────────────────┐
│  [Player 1]              [Player 2]           [Player 3]│
│  Avatar+name             Avatar+name          Avatar+name│
│  ❤️❤️❤️                 ❤️❤️❤️               ❤️❤️❤️   │
│                                                          │
│              ┌──────────────────────┐                   │
│              │ Chidiya | चिड़िया    │                   │
│              │ [████████░░░░░]      │ ← Timer bar       │
│              └──────────────────────┘                   │
│      finger indicators near table edge for players      │
│              [          UDD!          ]                 │
└─────────────────────────────────────────────────────────┘
```

- Solo mode uses circular table; multiplayer uses rectangular table.
- Player cards: DiceBear SVG avatar + name + life hearts
- Finger UI per player: default down position; animate slightly up on click.
- Player at 1 life: add pulse/vignette danger styling.
- Eliminated player: `filter: grayscale(100%)` via Framer Motion
- Eliminated player also gets spectator reaction controls ("😂", "😮") with floating, fading reaction particles.

**Step 4:** Connect to PartyKit using `partysocket`

```typescript
import usePartySocket from "partysocket/react";

const socket = usePartySocket({
  host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
  room: params.id,
  onMessage: (event) => {
    const msg = JSON.parse(event.data);
    // Handle all message types and update Zustand store
  },
});
```

Add multiplayer events/state for:

- remote UDD clicks -> animate corresponding finger and play positional ghost tap.
- life-loss feedback -> trigger synchronized table shake + red blink.
- spectator reactions -> broadcast reaction payload and animate float-up near source avatar.

**Step 5:** Build room creation flow

- On home page "Create Room" click: generate nanoid code, navigate to `/room/[code]`
- On "Join Room": input code → navigate to `/room/[enteredCode]`
- Share button on room lobby copies the full URL

---

### Phase 3.3 — Leaderboard Page (45 mins)

**Step 1:** Create Server Action `src/app/actions/saveScore.ts`

```typescript
"use server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function saveScore(
  email: string,
  itemsCorrect: number,
): Promise<void> {
  await db
    .update(users)
    .set({
      totalCorrect: sql`${users.totalCorrect} + ${itemsCorrect}`,
      gamesPlayed: sql`${users.gamesPlayed} + 1`,
    })
    .where(eq(users.email, email));
}
```

Add separate server actions:

- `lookupPlayerByEmail(email)` -> returns `{ name, email, avatar } | null`
- `registerPlayer({ name, email, avatar })` -> creates user profile before first game
- `saveScore` updates only `totalCorrect/gamesPlayed` and never wipes stored avatar

**Step 2:** Build `src/app/leaderboard/page.tsx` as a Server Component

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function LeaderboardPage() {
  const bayesianScore = sql<number>`CAST(${users.totalCorrect} + 50 AS FLOAT) / CAST(${users.gamesPlayed} + 5 AS FLOAT)`;
  const top = await db
    .select()
    .from(users)
    .orderBy(desc(bayesianScore))
    .limit(20);
  // render table
}
```

**Step 3:** Build `src/components/leaderboard/LeaderboardTable.tsx`

- shadcn Card wrapping a clean table
- Each row: rank number + DiceBear avatar + name + total correct + games played
- Highlight current user's row

---

### Phase 3.4 — Polish & Deployment (1.5 hours)

**Step 1:** Victory Screen

- Full-screen overlay when GAME_OVER received
- Winner's avatar (large) + "🎉 [Name] Wins!"
- canvas-confetti burst
- "Play Again" button → sends PLAY_AGAIN to server

**Step 2:** Audio integration

- Call `initAudio()` on first user interaction (click/tap) — required by browsers
- In message handler: `playSound(msg.item.id)` when NEW_ITEM received
- `playSound('correct')` / `playSound('wrong')` on result
- Add subtle `tap-soft.mp3` for remote/ghost UDD clicks (low volume, positional feel through pan/volume mix)

**Step 3:** Mobile / Landscape UX

- Add `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Show pre-game permission sheet:
  - all modes: "Tap to enable audio"
  - multiplayer: add "Rotate your phone" requirement in portrait mode

**Step 4:** Deploy PartyKit

```bash
npx partykit deploy
# Copy the output URL: https://chidiya-udd-server.USERNAME.partykit.dev
```

**Step 5:** Deploy to Vercel

```bash
# Push to GitHub
# Connect repo to Vercel
# Set Environment Variables in Vercel dashboard:
#   DATABASE_URL = your-neon-connection-string
#   NEXT_PUBLIC_PARTYKIT_HOST = chidiya-udd-server.USERNAME.partykit.dev
npx vercel --prod
```

---

## Package.json Scripts Reference

```json
{
  "scripts": {
    "dev": "partykit dev & next dev",
    "build": "next build",
    "start": "next start",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "generate:audio": "node scripts/generate-audio.js",
    "generate:sprite": "cd raw-sounds && audiosprite --format howler --export mp3 --output ../public/sounds/chidiya_sprite *.mp3"
  }
}
```

---

## Environment Variables Checklist

| Variable                    | Where Used                       | Value Source                |
| --------------------------- | -------------------------------- | --------------------------- |
| `DATABASE_URL`              | Next.js + PartyKit               | Neon.tech dashboard         |
| `NEXT_PUBLIC_PARTYKIT_HOST` | Next.js client                   | After `npx partykit deploy` |
| `ELEVENLABS_API_KEY`        | Local script only (not deployed) | ElevenLabs dashboard        |

---

## Estimated Timeline

| Day      | Focus                                           | Hours |
| -------- | ----------------------------------------------- | ----- |
| Day 1 AM | Project setup, DB schema, env setup             | 1.5h  |
| Day 1 PM | ElevenLabs script + audio sprite generation     | 2.5h  |
| Day 2 AM | Home page, Onboarding, DiceBear, Zustand stores | 2h    |
| Day 2 PM | Solo mode — full game loop + all UI components  | 3h    |
| Day 3 AM | PartyKit server + multiplayer socket logic      | 2.5h  |
| Day 3 PM | Multiplayer Room UI + Leaderboard + Deployment  | 3h    |

**Total: ~14–15 focused hours across 3 days**

---

## Key Gotchas & Tips

1. **Identity restore order matters** — check localStorage first, then email lookup, then name registration fallback.
2. **Audio must be initialized after user gesture** — browsers block autoplay. Gate `initAudio()` on first click anywhere.
3. **nanoid in App Router** — use `nanoid` (not `crypto.randomUUID()`) for room codes; it's shorter and URL-safe.
4. **PartyKit + Drizzle** — PartyKit server can import from `src/db/index.ts`, but make sure `tsconfig` paths are configured to resolve `@/*` from `src/`.
5. **Timer accuracy** — use `performance.now()` for client-side timer display. `setTimeout` alone drifts.
6. **DiceBear SVG in Next.js** — render as `<img src={`data:image/svg+xml,${encodeURIComponent(svg)}`} />` or use `dangerouslySetInnerHTML` in a container div.
7. **Landscape lock** — use CSS `@media (orientation: portrait)` to show a "Please rotate" overlay on the multiplayer room page.
8. **Audio Sprite** — always use `html5: true` in Howler for large sprite files; it streams instead of loading the whole file first.
9. **PartyKit round order** — hardcode round 1 item as `chidiya_udd`, then switch to random pool.
10. **PartyKit `currentItem`** — declare as a class property, not inside `onMessage`, so all methods can access it across the tick.
11. **Vibration support fallback** — `navigator.vibrate` is not available on all devices/browsers; feature-detect and fail gracefully.
12. **Spectator reactions** — throttle reaction spam per player to avoid network/UI overload.

---

_Built for the classic game Chidiya Udd_
