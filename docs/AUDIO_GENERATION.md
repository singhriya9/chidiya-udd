# 🎙️ Chidiya Udd — Audio Generation Guide

Everything you need to generate all voice clips, SFX, and build the final Howler sprite.

---

## Prerequisites

Before you start, make sure the following are installed and ready:

| Tool | Install Command | Purpose |
|---|---|---|
| Node.js ≥ 18 | — | Run generation script |
| FFmpeg | `winget install ffmpeg` / [ffmpeg.org](https://ffmpeg.org) | Required by audiosprite |
| audiosprite | `npm install -g audiosprite` | Merge MP3s into a single sprite |
| ElevenLabs account | [elevenlabs.io](https://elevenlabs.io) | Voice synthesis API |

---

## Step 1 — Get Your ElevenLabs Credentials

1. Log in to [elevenlabs.io](https://elevenlabs.io)
2. Go to **Profile → API Keys** → copy your key
3. Go to **Voice Library** → pick an energetic, clear Hindi-friendly voice → copy the **Voice ID**

> ⚠️ The free tier gives you ~10,000 characters/month. The 30 phrases here are well within the limit.

---

## Step 2 — Set Your Credentials in `.env`

```env
# .env  (already in .gitignore)
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
DATABASE_URL=postgresql://...
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

---

## Step 3 — Run the Audio Generation Script

The script lives at `scripts/generate-audio.js` in the project root (created during project setup).

```bash
node scripts/generate-audio.js
```

What it does:
- Reads `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` from `process.env`
- Converts each item id → spoken text, e.g. `chidiya_udd` → `"Chidiya... Udd!"`
- Calls ElevenLabs TTS API (`eleven_flash_v2_5` model, stability 0.5, similarity_boost 0.8)
- Saves each clip as `raw-sounds/<id>.mp3`
- Adds a 300 ms delay between requests to avoid rate-limiting

### All 30 phrases generated

| File | Spoken text |
|---|---|
| `chidiya_udd.mp3` | "Chidiya... Udd!" |
| `maina_udd.mp3` | "Maina... Udd!" |
| `tota_udd.mp3` | "Tota... Udd!" |
| `kabootar_udd.mp3` | "Kabootar... Udd!" |
| `baaz_udd.mp3` | "Baaz... Udd!" |
| `titli_udd.mp3` | "Titli... Udd!" |
| `makhi_udd.mp3` | "Makhi... Udd!" |
| `eagle_udd.mp3` | "Eagle... Udd!" |
| `aeroplane_udd.mp3` | "Aeroplane... Udd!" |
| `helicopter_udd.mp3` | "Helicopter... Udd!" |
| `rocket_udd.mp3` | "Rocket... Udd!" |
| `patang_udd.mp3` | "Patang... Udd!" |
| `drone_udd.mp3` | "Drone... Udd!" |
| `balloon_udd.mp3` | "Balloon... Udd!" |
| `bandar_udd.mp3` | "Bandar... Udd!" |
| `hathi_udd.mp3` | "Hathi... Udd!" |
| `sher_udd.mp3` | "Sher... Udd!" |
| `kutta_udd.mp3` | "Kutta... Udd!" |
| `billi_udd.mp3` | "Billi... Udd!" |
| `ghoda_udd.mp3` | "Ghoda... Udd!" |
| `mez_udd.mp3` | "Mez... Udd!" |
| `kursi_udd.mp3` | "Kursi... Udd!" |
| `mobile_udd.mp3` | "Mobile... Udd!" |
| `laptop_udd.mp3` | "Laptop... Udd!" |
| `balti_udd.mp3` | "Balti... Udd!" |
| `joota_udd.mp3` | "Joota... Udd!" |
| `cycle_udd.mp3` | "Cycle... Udd!" |
| `fridge_udd.mp3` | "Fridge... Udd!" |
| `almirah_udd.mp3` | "Almirah... Udd!" |
| `gaadi_udd.mp3` | "Gaadi... Udd!" |

---

## Step 4 — Add SFX Files Manually

Download these 5 files from [freesound.org](https://freesound.org) (filter: **CC0 License**) and rename them:

| File | Search query on freesound.org | Feel |
|---|---|---|
| `correct.mp3` | "ding correct short" | Happy chime, ≤ 1s |
| `wrong.mp3` | "buzzer fail game" | Buzzer/error, ≤ 1s |
| `win.mp3` | "fanfare short win" | Triumphant, 2–3s |
| `lose.mp3` | "sad trombone short" | Wah-wah, 1–2s |
| `tap_soft.mp3` | "tap soft click" | Very subtle click for ghost UDD |

Place all 5 files in the `raw-sounds/` folder alongside the generated MP3s.

---

## Step 5 — Build the Audio Sprite

```bash
# From project root
cd raw-sounds
audiosprite --format howler --export mp3 --output ../public/sounds/chidiya_sprite *.mp3
cd ..
```

This produces two files:
- `public/sounds/chidiya_sprite.mp3` — the merged audio file
- `public/sounds/chidiya_sprite.json` — sprite map with start/end timestamps

> ⚠️ If audiosprite fails on Windows, make sure FFmpeg is in your `PATH`. Test with `ffmpeg -version`.

---

## Step 6 — Verify the Sprite JSON

Open `public/sounds/chidiya_sprite.json` and confirm it contains a `sprite` key with entries for all 35 sounds (30 voice + 5 SFX):

```json
{
  "resources": ["chidiya_sprite.mp3"],
  "sprite": {
    "chidiya_udd":   [0, 1200],
    "maina_udd":     [1500, 1100],
    ...
    "correct":       [45000, 800],
    "wrong":         [46500, 700],
    "win":           [48000, 2500],
    "lose":          [51000, 1800],
    "tap_soft":      [53500, 300]
  }
}
```

---

## Step 7 — Wire Into the App

`src/lib/audio.ts` (already scaffolded during setup) will:

1. Load the sprite JSON from `/sounds/chidiya_sprite.json`
2. Initialize Howler with `html5: true` (streams large files instead of fully buffering)
3. Expose `playSound(id: string)` for use across the app

**Trigger `initAudio()` only after a user gesture** (click/tap) — browsers block autoplay.

```typescript
// Example: in your AudioGate component
<button onClick={() => initAudio().then(() => setAudioReady(true))}>
  🔊 Tap to Enable Audio
</button>
```

---

## Regenerating Individual Clips

If a clip sounds off, regenerate just that one:

```bash
# Manually with curl
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID" \
  -H "xi-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Rocket... Udd!","model_id":"eleven_flash_v2_5","voice_settings":{"stability":0.5,"similarity_boost":0.8}}' \
  --output raw-sounds/rocket_udd.mp3
```

Then re-run Step 5 to rebuild the sprite.

---

## npm Script Reference

After setup, these scripts are available in `package.json`:

```bash
npm run generate:audio    # Run ElevenLabs script → fills raw-sounds/
npm run generate:sprite   # Build Howler sprite from raw-sounds/
```

Run them in order:
```bash
npm run generate:audio && npm run generate:sprite
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Error: ELEVENLABS_API_KEY not set` | Make sure `.env` exists and you ran `source .env` or restarted the terminal |
| `audiosprite: command not found` | Run `npm install -g audiosprite` |
| `ffmpeg not found` | Install FFmpeg and add to PATH |
| Clip sounds robotic | Try a different ElevenLabs voice or adjust `stability` (try 0.3–0.7) |
| Howler doesn't play in browser | Make sure `initAudio()` is called inside a user-gesture callback |
| Sprite JSON missing some sounds | Check `raw-sounds/` has all 35 files before running audiosprite |
