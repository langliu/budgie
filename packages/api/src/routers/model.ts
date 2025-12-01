import { db } from '@budgie/db'
import { models } from '@budgie/db/schema/model'
import { count, desc, eq, like, or } from 'drizzle-orm'
import z from 'zod'
import { protectedProcedure } from '../index'

export const modelRouter = {
  create: protectedProcedure
    .input(
      z.object({
        alias: z.string().optional(),
        avatarUrl: z.string().optional(),
        bio: z.string().optional(),
        homepageUrl: z.url().optional(),
        instagramUrl: z.url().optional(),
        name: z.string().min(1, '模特姓名不能为空'),
        weiboUrl: z.url().optional(),
        xUrl: z.url().optional(),
        youtubeUrl: z.url().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const result = await db.insert(models).values(input).returning()
      return result[0]
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      return await db.delete(models).where(eq(models.id, input.id))
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        keyword: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .handler(async ({ input }) => {
      const { keyword, page, pageSize } = input
      const offset = (page - 1) * pageSize

      // 构建筛选条件
      const whereCondition = keyword
        ? or(
            like(models.name, `%${keyword}%`),
            like(models.alias, `%${keyword}%`),
          )
        : undefined

      // 查询数据
      const data = await db
        .select()
        .from(models)
        .where(whereCondition)
        .orderBy(desc(models.createdAt))
        .limit(pageSize)
        .offset(offset)

      // 查询总数
      const totalResult = await db
        .select({ count: count() })
        .from(models)
        .where(whereCondition)
      const total = totalResult[0]?.count ?? 0

      return {
        data,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await db
        .select()
        .from(models)
        .where(eq(models.id, input.id))
      return result[0] || null
    }),

  update: protectedProcedure
    .input(
      z.object({
        alias: z.string().optional(),
        avatarUrl: z.string().optional(),
        bio: z.string().optional(),
        homepageUrl: z.url().optional(),
        id: z.string(),
        instagramUrl: z.url().optional(),
        name: z.string().min(1, '模特姓名不能为空').optional(),
        weiboUrl: z.url().optional(),
        xUrl: z.url().optional(),
        youtubeUrl: z.url().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input
      const result = await db
        .update(models)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(models.id, id))
        .returning()
      return result[0]
    }),
}
