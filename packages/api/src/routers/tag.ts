import { db } from '@budgie/db'
import { tags } from '@budgie/db/schema/model'
import { desc, eq } from 'drizzle-orm'
import z from 'zod'
import { protectedProcedure } from '../index'

export const tagRouter = {
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, '标签名不能为空'),
      }),
    )
    .handler(async ({ input }) => {
      const result = await db.insert(tags).values(input).returning()
      return result[0]
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      return await db.delete(tags).where(eq(tags.id, input.id))
    }),

  getAll: protectedProcedure.handler(async () => {
    return await db.select().from(tags).orderBy(desc(tags.createdAt))
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await db.select().from(tags).where(eq(tags.id, input.id))
      return result[0] || null
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, '标签名不能为空'),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input
      const result = await db
        .update(tags)
        .set(data)
        .where(eq(tags.id, id))
        .returning()
      return result[0]
    }),
}
