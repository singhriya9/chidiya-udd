'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function saveScore(email: string, itemsCorrect: number): Promise<void> {
  try {
    await db
      .update(users)
      .set({
        totalCorrect: sql`${users.totalCorrect} + ${itemsCorrect}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
      })
      .where(eq(users.email, email));
  } catch (error) {
    console.error('saveScore failed', error);
    // Keep gameplay intact when DB is temporarily unavailable.
  }
}
