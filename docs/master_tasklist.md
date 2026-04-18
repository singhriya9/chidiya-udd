# ✅ Chidiya Udd — Master Task List

> Real-time multiplayer reaction game · Next.js + PartyKit + Neon + ElevenLabs

---

## Phase 1 — Project Scaffolding & Setup

### 1.1 Bootstrap the project
- [ ] Run `npx create-next-app@latest chidiya-udd --typescript --tailwind --app --src-dir --import-alias "@/*"`
- [ ] Verify dev server starts: `npm run dev`

### 1.2 Install all dependencies (single batch)
- [ ] UI: `npm install framer-motion lucide-react class-variance-authority clsx tailwind-merge`
- [ ] shadcn: `npx shadcn@latest init` → configure theme (dark by default, orange/amber accent)
- [ ] shadcn components: `npx shadcn@latest add button input card dialog badge`  
- [ ] Game UX: `npm install howler @types/howler canvas-confetti @types/canvas-confetti`
- [ ] Avatars: `npm install @dicebear/core @dicebear/collection`
- [ ] State/sockets: `npm install zustand partysocket nanoid`
- [ ] Database: `npm install drizzle-orm @neondatabase/serverless`
- [ ] Dev tools: `npm install -D drizzle-kit partykit`

### 1.3 Configure project structure
- [ ] Create `party/` directory at project root
- [ ] Create `scripts/` directory at project root
- [ ] Create `raw-sounds/` directory at project root (gitignored)
- [ ] Add `raw-sounds/` and `.env` to `.gitignore`
- [ ] Create `public/sounds/` directory

### 1.4 Configure Tailwind & fonts
- [ ] In `tailwind.config.ts` add dark mode, custom game colors (deep navy bg, amber UDD button, red for danger)
- [ ] Import Google Font `Outfit` (or `Inter`) in `src/app/layout.tsx`
- [ ] Set dark mode class on `<html>` in layout by default

### 1.5 Configure TypeScript paths
- [ ] Verify `@/*` maps to `src/*` in `tsconfig.json`
- [ ] Add `party/` to `tsconfig.json` `include` so PartyKit code is typed

---

## Phase 2 — Database Setup

### 2.1 Neon + Drizzle
- [ ] Create `.env` with `DATABASE_URL`, `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- [ ] Write `src/db/schema.ts` — `users` table (id, name, email, avatar, wins, games, created_at)
- [ ] Write `src/db/index.ts` — Drizzle + Neon HTTP client
- [ ] Write `drizzle.config.ts`
- [ ] Run `npx drizzle-kit push` to create table in Neon
- [ ] Verify table in Neon dashboard

---

## Phase 3 — Audio Pipeline

> Refer to `AUDIO_GENERATION.md` for full details.

### 3.1 Generate voice clips
- [ ] Write `scripts/generate-audio.js` (reads from `.env`, calls ElevenLabs TTS API)
  - Includes all 30 item phrases: `"Chidiya... Udd!"` … `"Gaadi... Udd!"`
  - 300ms delay between requests
  - Saves to `raw-sounds/<id>.mp3`
- [ ] Run `node scripts/generate-audio.js`
- [ ] Verify all 30 MP3 files in `raw-sounds/`

### 3.2 Collect SFX
- [ ] Download and place in `raw-sounds/`:
  - [ ] `correct.mp3` — happy ding ≤ 1s (CC0 from freesound.org)
  - [ ] `wrong.mp3` — buzzer/fail ≤ 1s
  - [ ] `win.mp3` — short fanfare 2–3s
  - [ ] `lose.mp3` — sad trombone 1–2s
  - [ ] `tap_soft.mp3` — subtle click for ghost UDD sound

### 3.3 Build Howler sprite
- [ ] Install globally: `npm install -g audiosprite`
- [ ] Ensure FFmpeg is in PATH (`ffmpeg -version` passes)
- [ ] Run: `cd raw-sounds && audiosprite --format howler --export mp3 --output ../public/sounds/chidiya_sprite *.mp3`
- [ ] Verify `public/sounds/chidiya_sprite.mp3` and `.json` exist
- [ ] Check sprite JSON has all 35 sound keys

### 3.4 Wire audio into the app
- [ ] Write `src/lib/audio.ts` — Howler lazy init + `playSound(id)` + `initAudio()`

---

## Phase 4 — State Management (Zustand)

- [ ] Write `src/store/usePlayerStore.ts`
  - Fields: `name`, `email`, `avatarSeed`
  - Actions: `setPlayer`, `clearPlayer`
  - Persist to `localStorage`
- [ ] Write `src/store/useGameStore.ts`
  - Fields: `lives`, `score`, `level`, `currentItem`, `isPlaying`, `gameOver`, `shakeTrigger`
  - Actions: `loseLife`, `addScore`, `nextLevel`, `setItem`, `startGame`, `endGame`, `reset`
- [ ] Write `src/lib/avatar.ts` — DiceBear `micah` helper: `getAvatarSvg(seed: string): string`

---

## Phase 5 — Server Actions (Backend API)

- [ ] Write `src/app/actions/player.ts`
  - `lookupPlayerByEmail(email)` → returns `{ name, email, avatar } | null`
  - `registerPlayer({ name, email, avatar })` → inserts new user, returns user
- [ ] Write `src/app/actions/saveScore.ts`
  - `saveScore(email, won)` → increments `wins` (if won) and `games` ; never overwrites avatar

---

## Phase 6 — Shared Data: Items JSON

- [ ] Create `party/items.json` with all 30 items
  - Schema: `{ id, english, hindi, flies }` — no emoji field
  - Order: flying items first (14), non-flying items second (16)
  - Round 1 is always `chidiya_udd` (enforced in game logic, not the JSON)

---

## Phase 7 — Core UI Components

> All components use Framer Motion for animations, Tailwind for styling, shadcn for primitives.

### 7.1 Design System & Global Styles
- [ ] Define CSS custom properties in `src/app/globals.css`:
  - Background: deep midnight blue/navy
  - Accent: warm amber/saffron (`#F59E0B`) for UDD button
  - Danger: crimson red for life loss
  - Text: off-white
- [ ] Add `@keyframes` for shake, pulse-danger, float-up-reaction

### 7.2 `IdentityGate` — Onboarding Flow (`src/components/lobby/IdentityGate.tsx`)
- [ ] Step 1: Email-only input with validation
- [ ] Call `lookupPlayerByEmail` → if found, hydrate store from backend → proceed
- [ ] If not found: show name field + auto-generate DiceBear avatar preview
- [ ] Call `registerPlayer` → persist to store + localStorage
- [ ] Animation: slide-in form cards with Framer Motion `AnimatePresence`

### 7.3 Home Screen (`src/app/page.tsx`)
- [ ] If no local profile → render `<IdentityGate />`
- [ ] If profile exists → show home screen with:
  - Player avatar + name in top-right corner
  - Large "Play Solo" button (amber gradient)
  - "Create Room" button
  - "Join Room" input (paste code or URL)
  - "Leaderboard" button
- [ ] Stagger-animate buttons on mount (Framer Motion `staggerChildren`)
- [ ] Game logo / hindi title with decorative treatment at top

### 7.4 `TimerBar` (`src/components/game/TimerBar.tsx`)
- [ ] `motion.div` animates `width: "100%" → "0%"` over `timerMs` ms
- [ ] `transition={{ duration: timerMs/1000, ease: 'linear' }}`
- [ ] Color transitions: green → yellow → red via CSS gradient or JS-driven style
- [ ] Re-key with `key={round}` to restart each round
- [ ] Add subtle glow effect that intensifies as timer runs out

### 7.5 `ItemDisplay` (`src/components/game/ItemDisplay.tsx`)
- [ ] Displays item name: large English + smaller Hindi below
- [ ] No emoji/icon — text only (bold, premium display font)
- [ ] Framer Motion: item flies in from top `y: -80 → 0, opacity: 0 → 1`
- [ ] Re-key with item id to re-trigger animation each round

### 7.6 `UddButton` (`src/components/game/UddButton.tsx`)
- [ ] Giant button — amber gradient, takes significant vertical space
- [ ] Label: "UDD!" in large bold text
- [ ] `whileTap={{ scale: 0.93 }}` press animation
- [ ] `whileHover={{ scale: 1.02, brightness: 1.1 }}` hover effect
- [ ] Disabled briefly after press (debounce ~650ms) to prevent spam
- [ ] On valid press: `navigator.vibrate?.([50])`
- [ ] Emit action via callback prop

### 7.7 `LivesDisplay` (`src/components/game/LivesDisplay.tsx`)
- [ ] 3 or 5 heart icons (Lucide `Heart`)
- [ ] Lost hearts: grey + scale-down Framer Motion animation
- [ ] Full-screen red flash overlay on life loss: `opacity: 0.45 → 0` over 600ms
- [ ] On life loss: `navigator.vibrate?.([100, 50, 100])`
- [ ] Expose `danger` boolean prop (lives === 1) for parent to apply danger styling

### 7.8 `TableShell` (`src/components/game/TableShell.tsx`)
- [ ] Wrapper div for the game table area
- [ ] Supports `shape="circle" | "rectangle"` prop
- [ ] Circle: CSS `border-radius: 50%`, centered for solo
- [ ] Rectangle: for multiplayer landscape layout
- [ ] On `shakeTrigger` prop change: play x-axis shake animation (Framer Motion `keyframes`)
- [ ] Table has a subtle felt/gradient texture via CSS background

### 7.9 `FingerIndicator` (`src/components/game/FingerIndicator.tsx`)
- [ ] SVG or emoji finger (👆) positioned at table edge
- [ ] Default: pointing down/rest position
- [ ] On `isClicking` prop: animate slightly up then back to rest
- [ ] Transition: spring physics for natural feel

---

## Phase 8 — Solo Mode

### 8.1 Game Engine (`src/app/solo/page.tsx`)
- [ ] `AudioGate` — modal requiring user tap before game starts: `"Tap to Enable Audio"`
- [ ] On audio enabled: call `initAudio()`, start game loop
- [ ] Timer levels: `[3000, 2500, 2000, 1500, 1200, 1000]` ms (shrink per level)
- [ ] Round 1: always `chidiya_udd`; rounds 2+: random from full pool
- [ ] Per round:
  - [ ] Set `currentItem` in store
  - [ ] `playSound(item.id)` via Howler
  - [ ] Start countdown timer with `performance.now()`
  - [ ] On timer expire: evaluate missed response
  - [ ] On UDD click: evaluate immediately, disable button, wait 650ms before next round
- [ ] Evaluation logic:
  - `flies && clicked` → correct: `addScore()`, `playSound('correct')`
  - `flies && !clicked` → wrong: `loseLife()`, `playSound('wrong')`, trigger shake + red blink
  - `!flies && clicked` → wrong: `loseLife()`, `playSound('wrong')`, trigger shake + red blink
  - `!flies && !clicked` → correct (no action needed, round continues)
- [ ] 800ms pause between rounds
- [ ] Level up every 5 correct answers → reduce timer bracket
- [ ] On 0 lives: set `gameOver = true` → save score via `saveScore` action

### 8.2 Solo Layout
- [ ] Circular table centered on screen
- [ ] `<ItemDisplay />` — above table
- [ ] `<TimerBar />` — below item display
- [ ] Score counter — top-right
- [ ] Level indicator — top-left
- [ ] `<LivesDisplay />` — 5 hearts, below timer
- [ ] `<FingerIndicator />` — at table bottom edge, player's finger
- [ ] `<UddButton />` — bottom center, large

### 8.3 Game Over Screen
- [ ] Full-screen overlay with Framer Motion slide-up
- [ ] Final score + level reached displayed prominently
- [ ] `canvas-confetti` burst on appear
- [ ] "Play Again" → reset store → stays on page
- [ ] "View Leaderboard" → navigate to `/leaderboard`

---

## Phase 9 — PartyKit Server

### 9.1 Configuration
- [ ] Create `partykit.json`: `{ "name": "chidiya-udd-server", "main": "party/server.ts", "compatibilityDate": "2024-01-01" }`

### 9.2 Build `party/server.ts`
- [ ] Class properties: `players: Map<string, Player>`, `gameActive`, `currentItem`, `roundResponses`, `roundTimer`, `currentTimer`
- [ ] `onConnect`: send `CONNECTED` with conn id; `broadcastPlayers()`
- [ ] `onMessage` handler for:
  - [ ] `JOIN` — add player with 3 lives, broadcast players
  - [ ] `START_GAME` — set gameActive, broadcast `GAME_STARTED`, start first round after 1s
  - [ ] `UDD_CLICKED` — record response with timestamp, broadcast `PLAYER_ACTION`
  - [ ] `PLAY_AGAIN` — call `resetGame()`
- [ ] `newRound()`:
  - Round 1 always `chidiya_udd`; subsequent rounds: random from items
  - Broadcast `NEW_ITEM` + `timerMs` + `round`
  - Set `setTimeout` → `evaluateRound()`
- [ ] `evaluateRound()`:
  - For each active player: check clicked vs `currentItem.flies`
  - Wrong → `player.lives--`, broadcast `LIVES_UPDATE`
  - Lives ≤ 0 → `player.active = false`, broadcast `PLAYER_OUT`
  - Correct + clicked → `player.score++`
  - If ≤ 1 active players → broadcast `GAME_OVER`
  - Else: reduce `roundTimer` by 50ms (min 1000ms), next round after 1200ms
- [ ] `broadcastPlayers()` — sends full player list
- [ ] `resetGame()` — reset all player lives/scores, `gameActive = false`, broadcast `ROOM_RESET`
- [ ] Test server locally: `npx partykit dev`

---

## Phase 10 — Multiplayer Room UI

### 10.1 Room Lobby (`src/components/lobby/RoomLobby.tsx`)
- [ ] Shows room code (large, monospace, styled) + "Copy Link" button
- [ ] Lists joined players: DiceBear avatar + name chips
- [ ] Host: "Start Game" button (disabled until ≥ 2 players)
- [ ] Non-host: "Waiting for host..." spinner
- [ ] Audio gate: "Enable Audio" button (required before game starts)
- [ ] On portrait mobile: show "🔄 Please rotate your phone" overlay until landscape

### 10.2 Multiplayer Game Table (`src/components/game/GameTable.tsx`)
- [ ] Rectangular table centered in landscape layout
- [ ] Player cards (2–8 players) arranged around the table perimeter:
  - DiceBear avatar
  - Name
  - Heart indicators (3 lives)
  - `<FingerIndicator />` along their table edge
- [ ] When `lives === 1` on a player card: apply pulsing amber/red vignette glow
- [ ] When player is eliminated: `filter: grayscale(1)` with Framer Motion transition
- [ ] Eliminated players see spectator reaction buttons: `😂 😮 👏 😱`
- [ ] Spectator reactions: `motion.div` float up from sender's avatar position and fade out
- [ ] Center area: `<ItemDisplay />` + `<TimerBar />`
- [ ] Bottom center: `<UddButton />` (large, accessible for thumbs)

### 10.3 Room Page (`src/app/room/[id]/page.tsx`)
- [ ] Read `params.id` as room code
- [ ] Connect via `usePartySocket` from `partysocket/react`
  - `host: process.env.NEXT_PUBLIC_PARTYKIT_HOST`
  - `room: params.id`
- [ ] On connect: send `JOIN` message with player name
- [ ] Handle all server message types and update Zustand store:
  - `PLAYER_JOINED` → update players list
  - `GAME_STARTED` → switch lobby → game view
  - `NEW_ITEM` → set item, reset timer, play `playSound(item.id)`
  - `PLAYER_ACTION` → animate that player's finger, play `tap_soft` sound (low volume)
  - `LIVES_UPDATE` → update player lives in state, trigger red blink + shake if it's the current player
  - `PLAYER_OUT` → mark player as eliminated, enable spectator mode for them
  - `GAME_OVER` → show winner screen + confetti
  - `ROOM_RESET` → reset all UI to lobby
- [ ] Show correct view: `!gameStarted` → `<RoomLobby />`, `gameStarted` → `<GameTable />`

### 10.4 Room creation/joining flow (Home Screen)
- [ ] "Create Room": `nanoid(6)` → navigate to `/room/[code]`
- [ ] "Join Room": input for 6-char code → navigate to `/room/[enteredCode]`
- [ ] Room lobby "Copy Link" → copies `window.location.href` to clipboard

### 10.5 Winner Screen
- [ ] Full-screen overlay (Framer Motion) on `GAME_OVER`
- [ ] Winner's large DiceBear avatar + `"🎉 [Name] Wins!"`
- [ ] `canvas-confetti` burst (multi-direction)
- [ ] "Play Again" → send `PLAY_AGAIN` to PartyKit server
- [ ] Save winner/loser scores via `saveScore` server action

---

## Phase 11 — Leaderboard

- [ ] Build `src/app/leaderboard/page.tsx` as a Next.js Server Component
  - Fetch top 20 by `wins DESC` via Drizzle
- [ ] Build `src/components/leaderboard/LeaderboardTable.tsx`
  - shadcn Card wrapping styled table
  - Columns: Rank · Avatar · Name · Wins · Games Played
  - Highlight current user's row (read from URL param or cookie)
  - Stagger-animate rows on load (Framer Motion)
  - Medal badges (🥇🥈🥉) for top 3 ranks

---

## Phase 12 — Polish & Micro-Interactions

### 12.1 Animations audit
- [ ] Item entrance: flies in from top each round — ✓ (ItemDisplay)
- [ ] Timer glow intensifies as it runs out — ✓ (TimerBar)
- [ ] UDD button scale on tap — ✓ (UddButton)
- [ ] Finger lifts and returns on UDD — ✓ (FingerIndicator)
- [ ] Red screen flash on life loss — ✓ (LivesDisplay)
- [ ] X-axis table shake on life loss — ✓ (TableShell)
- [ ] Pulse vignette on 1 life remaining — ✓ (player card)
- [ ] Grayscale eliminated players — ✓ (GameTable)
- [ ] Spectator reactions float up + fade — ✓ (GameTable)
- [ ] Confetti on win/game over — ✓ (Winner screen + Solo game over)
- [ ] Stagger buttons on home page load — ✓ (Home)
- [ ] Slide-in leaderboard rows — ✓ (LeaderboardTable)

### 12.2 Mobile & Responsive
- [ ] Verify `<meta name="viewport" content="width=device-width, initial-scale=1">` in layout
- [ ] Multiplayer: `@media (orientation: portrait)` overlay: "🔄 Rotate your phone"
- [ ] UDD button: accessible thumb reach on mobile (bottom center or split sides)
- [ ] Test on iOS Safari: ensure `initAudio()` called inside touchstart handler (iOS strict)

### 12.3 Haptic feedback
- [ ] UDD tap: `navigator.vibrate?.([50])` — feature-detect, fail silently
- [ ] Life loss: `navigator.vibrate?.([100, 50, 100])`

### 12.4 Accessibility
- [ ] All interactive elements have unique `id` attributes
- [ ] UDD button has `aria-label`
- [ ] Hearts display `aria-label="X lives remaining"`
- [ ] Color contrast passes WCAG AA on dark background

---

## Phase 13 — package.json Scripts

- [ ] Update `package.json` scripts:
```json
{
  "dev": "partykit dev & next dev",
  "build": "next build",
  "start": "next start",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "generate:audio": "node scripts/generate-audio.js",
  "generate:sprite": "cd raw-sounds && audiosprite --format howler --export mp3 --output ../public/sounds/chidiya_sprite *.mp3"
}
```

---

## Phase 14 — Audio Generation (Pre-Deploy)

> See `AUDIO_GENERATION.md` for full step-by-step guide.

- [ ] Fill `.env` with `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`
- [ ] Run `npm run generate:audio` → 30 MP3s in `raw-sounds/`
- [ ] Download 5 SFX from freesound.org (CC0) into `raw-sounds/`
- [ ] Install audiosprite + FFmpeg
- [ ] Run `npm run generate:sprite` → `public/sounds/chidiya_sprite.mp3` + `.json`
- [ ] Verify sprite JSON has all 35 keys

---

## Phase 15 — Deployment

> See `DEPLOYMENT.md` for full step-by-step guide.

- [ ] Run `npx drizzle-kit push` from local (create DB tables)
- [ ] Login to PartyKit: `npx partykit login`
- [ ] Deploy PartyKit: `npx partykit deploy` → copy the `.partykit.dev` URL
- [ ] Push code to GitHub
- [ ] Import repo to Vercel
- [ ] Set Vercel env vars: `DATABASE_URL`, `NEXT_PUBLIC_PARTYKIT_HOST`
- [ ] Deploy to Vercel: `npx vercel --prod` or via GitHub auto-deploy
- [ ] Run production smoke test checklist (see DEPLOYMENT.md § Part 4)

---

## Known Gotchas (Track As You Build)

- [ ] Audio must be initialized after user gesture — gate `initAudio()` on first click
- [ ] PartyKit `currentItem` must be a class property, not a local variable
- [ ] Timer display: use `performance.now()` for accurate countdown; `setTimeout` drifts
- [ ] DiceBear SVG in Next.js: render as `<img src={"data:image/svg+xml," + encodeURIComponent(svg)} />`
- [ ] PartyKit round 1: hardcode `chidiya_udd` in `newRound()`, then switch to random pool
- [ ] `nanoid` for room codes (not `crypto.randomUUID()`) — shorter, URL-safe
- [ ] Throttle spectator reactions per player to avoid flooding
- [ ] `navigator.vibrate` is undefined on iOS/Desktop — feature-detect before calling
- [ ] Howler `html5: true` for large sprite files — streams instead of fully buffering
- [ ] PartyKit sends to Cloudflare edge — latency is ≤ 50ms globally compared to a regional server
