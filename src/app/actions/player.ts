'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function lookupPlayerByEmail(
  email: string,
): Promise<{ name: string; email: string; avatar: string } | null> {
  try {
    const result = await db
      .select({ name: users.name, email: users.email, avatar: users.avatar })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    console.error("lookupPlayerByEmail failed", error);
    // Degrade gracefully when DB is unreachable so onboarding can continue.
    return null;
  }
}

export async function registerPlayer(player: {
  name: string;
  email: string;
  avatar: string;
}): Promise<{ name: string; email: string; avatar: string }> {
  try {
    const result = await db
      .insert(users)
      .values({
        name: player.name,
        email: player.email,
        avatar: player.avatar,
      })
      .onConflictDoNothing()
      .returning({ name: users.name, email: users.email, avatar: users.avatar });

    // Return newly created or existing (in case of conflict)
    if (result.length > 0) return result[0];
    const existing = await lookupPlayerByEmail(player.email);
    return existing ?? player;
  } catch (error) {
    console.error("registerPlayer failed", error);
    // Keep UX functional even if persistence is temporarily unavailable.
    return player;
  }
}
