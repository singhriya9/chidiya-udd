# 🚀 Chidiya Udd — Deployment Guide

How to ship the Next.js app (Vercel) and the PartyKit WebSocket server (Cloudflare Edge).

---

## Architecture Overview

```
Browser ──HTTP──► Vercel (Next.js)
    │
    └──WebSocket──► PartyKit (Cloudflare Workers Edge)
                        │
                        └──(optional future)──► Neon PostgreSQL
```

- **Vercel** hosts your Next.js app (pages, API routes, Server Actions, leaderboard SSR).
- **PartyKit** hosts your real-time WebSocket game server (`party/server.ts`) on Cloudflare's edge network globally.
- Both services need to know about each other via environment variables.

---

## Part 1 — Deploy the PartyKit Server

PartyKit must be deployed **before** Vercel so you have the production host URL to put in your env.

### Step 1 — Login to PartyKit

```bash
npx partykit login
# Opens browser to authenticate with your GitHub account
```

### Step 2 — Deploy

```bash
npx partykit deploy
```

On success, the CLI prints:

```
✓ Deployed chidiya-udd-server to
  https://chidiya-udd-server.<your-github-username>.partykit.dev
```

Copy that URL — you'll need it in Step 3.

### Step 3 — Test the PartyKit endpoint

```bash
curl https://chidiya-udd-server.<your-username>.partykit.dev/party/test
# Should return 200 or a Party response
```

---

## Part 2 — Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git init          # if not already a git repo
git add .
git commit -m "feat: initial chidiya-udd build"
git remote add origin https://github.com/<your-username>/chidiya-udd.git
git push -u origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select `chidiya-udd`
3. Framework preset: **Next.js** (auto-detected)
4. Keep default build settings (`next build`)

### Step 3 — Set Environment Variables in Vercel Dashboard

Go to **Project Settings → Environment Variables** and add:

| Variable | Value | Environment |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | Production, Preview |
| `NEXT_PUBLIC_PARTYKIT_HOST` | `chidiya-udd-server.<username>.partykit.dev` | Production, Preview |

> ⚠️ `ELEVENLABS_API_KEY` is **not** needed on Vercel — the audio generation script runs locally only.

### Step 4 — Deploy

```bash
# Option A: trigger from Vercel dashboard (push to main → auto-deploys)
git push origin main

# Option B: deploy via CLI
npx vercel --prod
```

---

## Part 3 — One-Time: Run Database Migration

Before the first deploy, or any time you change `src/db/schema.ts`:

```bash
# From your local machine (uses .env)
npx drizzle-kit push
```

This creates the `users` table in your Neon database.

---

## Part 4 — Verify the Production Deployment

After Vercel deploys, run through this checklist:

### Basic smoke test

- [ ] Visit `https://your-app.vercel.app` → Onboarding screen shows
- [ ] Enter email → check if returning player lookup works (or new player creation)
- [ ] Home screen shows: Solo, Create Room, Join Room, Leaderboard

### Solo mode

- [ ] Start Solo → audio permission gate appears
- [ ] Tap to enable audio → voice clips play correctly
- [ ] Timer bar animates and shrinks
- [ ] Correct/wrong reactions trigger haptic + visual feedback
- [ ] Game over screen appears, score saves to Neon

### Multiplayer

- [ ] Create Room → generates 6-char code, shows shareable URL
- [ ] Open URL in a second browser tab/device → second player joins
- [ ] Host starts game → both see same items in sync
- [ ] UDD click triggers finger animation for all players
- [ ] Life loss triggers red blink + table shake for all players
- [ ] Last player standing → confetti + winner screen
- [ ] Play Again resets room correctly

### Leaderboard

- [ ] `/leaderboard` page renders top 20 players
- [ ] Current user's row is highlighted
- [ ] Wins/games counts update after game ends

---

## Part 5 — Environment Variables Summary

### Local (`.env`)

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=abc123...
```

### Vercel Production (Dashboard → Environment Variables)

```
DATABASE_URL              = postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_PARTYKIT_HOST = chidiya-udd-server.<username>.partykit.dev
```

### `partykit.json`

```json
{
  "name": "chidiya-udd-server",
  "main": "party/server.ts",
  "compatibilityDate": "2024-01-01"
}
```

---

## Part 6 — Redeployment Workflow

### Updating the Next.js app

```bash
git add .
git commit -m "fix: ..."
git push origin main
# Vercel auto-deploys on push to main
```

### Updating the PartyKit server

```bash
npx partykit deploy
# Takes ~10 seconds. Live immediately after.
```

### Updating the DB schema

```bash
# Edit src/db/schema.ts, then:
npx drizzle-kit push
```

---

## Part 7 — Custom Domain (Optional)

In **Vercel Dashboard → Domains**:
1. Add your domain (e.g., `chidiya-udd.com`)
2. Update DNS as instructed by Vercel
3. Done — HTTPS is automatically provisioned

Update `NEXT_PUBLIC_PARTYKIT_HOST` in Vercel env if you also want a custom domain for the PartyKit server (managed via PartyKit dashboard at [partykit.io](https://www.partykit.io)).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `NEXT_PUBLIC_PARTYKIT_HOST` is undefined in production | Ensure you set it in Vercel env panel and re-deployed |
| WebSocket connection fails in production | Confirm the PartyKit server deployed successfully and URL is correct |
| Leaderboard shows nothing | Check `DATABASE_URL` is set in Vercel env and `drizzle-kit push` was run |
| Audio doesn't play on iOS | Ensure `initAudio()` is called inside a touchstart/click handler — iOS is strict |
| Build fails on Vercel | Check `next build` passes locally first; confirm all imports resolve |
| `partykit deploy` fails | Make sure you're logged in: `npx partykit login` |
