# Chidiya Udd

Chidiya Udd is a real-time multiplayer reaction-based web game inspired by the classic Indian children's game. Players must react within a shrinking time window to decide whether a called object "flies" (udd) or not. A wrong click or a missed flying object costs a life. The last person standing wins.

## Modes of Play

- **Solo Mode**: Play against the computer with a gradually shrinking reaction timer. The player starts with 5 lives.
- **Multiplayer Mode**: Create or join a real-time room to play with friends globally. Features poker-style avatar layouts, live reactions, real-time penalty tracking, and synchronization via WebSockets. Each match locks to one random pack of items, then draws rounds from that pack.

## Technology Stack

- **Frontend Framework**: Next.js 16 (App Router), React
- **Real-Time Edge Server**: PartyKit (Cloudflare Workers infrastructure)
- **Database Architecture**: Neon.tech (Serverless PostgreSQL) with Drizzle ORM
- **Styling & User Interface**: Tailwind CSS, shadcn/ui, Framer Motion
- **Audio Engine**: Howler.js utilizing programmatic audio sprites
- **State Management**: Zustand
- **Avatar Generation**: DiceBear

## Prerequisites

Before starting local development, ensure you have the following tools available:

- Node.js (v18 or higher)
- FFmpeg (Required/Optional for audio sprite generation)

## Getting Started

### 1. Environment Configuration

Create a `.env` file in the root directory matching the provided `.env.example`:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

### 2. Database Migration

To bootstrap the database schema, which powers the global user leaderboard and Bayesian ranking, run the Drizzle ORM migration configuration:

```bash
npm run db:push
```

### 3. Generating Audio Sprites

Audio assets can be generated dynamically via the ElevenLabs API, or bypassed entirely as the game supports silent visual-only gameplay loops.

1. Divide the master item list into distinct operational packs:
   ```bash
   npm run generate:packs
   ```
   The PartyKit server selects one pack at the start of each match and then chooses round items randomly from that pack.
2. Generate the individual MP3 components:
   ```bash
   npm run generate:audio
   ```
3. Generate the Howler audio sprite JSON mappings:
   _(Refer to the CLI output from the step above for specific audiosprite commands)_

### 4. Running the Development Server

You can launch both the Next.js frontend and the local PartyKit websockets simulation concurrently:

```bash
npm run dev:all
```

Alternatively, you can run `npm run dev` and `npx partykit dev` in separate terminal instances.

## Deployment Architecture

The application is decoupled for low-latency distribution:

1. **PartyKit Server**: Manages the socket connections. Deploy the server independently to the edge via:
   ```bash
   npx partykit deploy
   ```
2. **Next.js Frontend**: Hosted natively via Vercel. Connect your repository to Vercel and ensure the `NEXT_PUBLIC_PARTYKIT_HOST` and `DATABASE_URL` environment variables are properly mapped to your production configuration.

For deeper technical granularity regarding audio configurations or deployment strategies, consult the underlying documents in the `/docs` directory.
