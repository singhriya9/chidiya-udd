import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, sql, gt } from 'drizzle-orm';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/shared/SiteFooter';

export const metadata: Metadata = {
  title: 'Leaderboard — Chidiya Udd',
  description: 'Top players in Chidiya Udd — the real-time reaction game.',
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  let topPlayers: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    totalCorrect: number | null;
    gamesPlayed: number | null;
    rankScore: number | null;
  }[] = [];

  try {
    const bayesianScore = sql<number>`CAST(${users.totalCorrect} + 50 AS FLOAT) / CAST(${users.gamesPlayed} + 5 AS FLOAT)`;

    topPlayers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        gamesPlayed: users.gamesPlayed,
        totalCorrect: users.totalCorrect,
        rankScore: bayesianScore,
      })
      .from(users)
      .where(gt(users.gamesPlayed, 0))
      .orderBy(desc(bayesianScore))
      .limit(20);
  } catch {
    // DB not configured yet — show empty state
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-4xl font-black text-white mb-2">Leaderboard</h1>
          <p className="text-slate-400">Top players by Bayesian Rank</p>
        </div>

        <LeaderboardTable players={topPlayers} />
      </div>
      <SiteFooter className="fixed bottom-0 left-0 right-0 px-4 pb-2" />
    </div>
  );
}
