import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const todo = sqliteTable('todo', {
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$default(() => new Date())
    .notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$default(() => new Date())
    .notNull()
    .$onUpdate(() => new Date()),
})
