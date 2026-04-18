import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  avatar: text('avatar').notNull(),
  totalCorrect: integer('total_correct').default(0),
  gamesPlayed: integer('games_played').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
