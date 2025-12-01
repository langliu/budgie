import { db } from '@budgie/db'
import {
  albumModels,
  albums,
  albumTags,
  models,
  tags,
} from '@budgie/db/schema/model'
import { and, count, desc, eq, inArray, like, or } from 'drizzle-orm'
import z from 'zod'
import { protectedProcedure } from '../index'

export const albumRouter = {
  create: protectedProcedure
    .input(
      z.object({
        coverImageUrl: z.string().optional(),
        description: z.string().optional(),
        modelIds: z.array(z.string()).optional(),
        publishedAt: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        title: z.string().min(1, '专辑标题不能为空'),
      }),
    )
    .handler(async ({ input }) => {
      const { modelIds, tagIds, ...albumData } = input
      const result = await db
        .insert(albums)
        .values({
          ...albumData,
          publishedAt: albumData.publishedAt
            ? new Date(albumData.publishedAt)
            : undefined,
        })
        .returning()
      const album = result[0]

      // 关联模特
      if (album && modelIds && modelIds.length > 0) {
        await db.insert(albumModels).values(
          modelIds.map((modelId) => ({
            albumId: album.id,
            modelId,
          })),
        )
      }

      // 关联标签
      if (album && tagIds && tagIds.length > 0) {
        await db.insert(albumTags).values(
          tagIds.map((tagId) => ({
            albumId: album.id,
            tagId,
          })),
        )
      }

      return album
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      return await db.delete(albums).where(eq(albums.id, input.id))
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        keyword: z.string().optional(),
        modelId: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        tagId: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { keyword, modelId, page, pageSize, tagId } = input
      const offset = (page - 1) * pageSize

      // 如果有模特筛选，先获取该模特关联的专辑 ID
      let albumIdsFromModel: string[] | undefined
      if (modelId) {
        const modelAlbums = await db
          .select({ albumId: albumModels.albumId })
          .from(albumModels)
          .where(eq(albumModels.modelId, modelId))
        albumIdsFromModel = modelAlbums.map((r) => r.albumId)
        if (albumIdsFromModel.length === 0) {
          return {
            data: [],
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          }
        }
      }

      // 如果有标签筛选，先获取该标签关联的专辑 ID
      let albumIdsFromTag: string[] | undefined
      if (tagId) {
        const tagAlbums = await db
          .select({ albumId: albumTags.albumId })
          .from(albumTags)
          .where(eq(albumTags.tagId, tagId))
        albumIdsFromTag = tagAlbums.map((r) => r.albumId)
        if (albumIdsFromTag.length === 0) {
          return {
            data: [],
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          }
        }
      }

      // 合并筛选条件：取交集
      let filteredAlbumIds: string[] | undefined
      if (albumIdsFromModel && albumIdsFromTag) {
        const tagAlbumIdSet = new Set(albumIdsFromTag)
        filteredAlbumIds = albumIdsFromModel.filter((id) =>
          tagAlbumIdSet.has(id),
        )
        if (filteredAlbumIds.length === 0) {
          return {
            data: [],
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          }
        }
      } else if (albumIdsFromModel) {
        filteredAlbumIds = albumIdsFromModel
      } else if (albumIdsFromTag) {
        filteredAlbumIds = albumIdsFromTag
      }

      // 构建查询条件
      const conditions = []
      if (keyword) {
        conditions.push(
          or(
            like(albums.title, `%${keyword}%`),
            like(albums.description, `%${keyword}%`),
          ),
        )
      }
      if (filteredAlbumIds) {
        conditions.push(inArray(albums.id, filteredAlbumIds))
      }
      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined

      // 获取专辑列表
      const albumList = await db
        .select()
        .from(albums)
        .where(whereCondition)
        .orderBy(desc(albums.createdAt))
        .limit(pageSize)
        .offset(offset)

      // 获取每个专辑的模特和标签
      const data = await Promise.all(
        albumList.map(async (album) => {
          // 获取关联的模特
          const albumModelRows = await db
            .select({ model: models })
            .from(albumModels)
            .innerJoin(models, eq(albumModels.modelId, models.id))
            .where(eq(albumModels.albumId, album.id))

          // 获取关联的标签
          const albumTagRows = await db
            .select({ tag: tags })
            .from(albumTags)
            .innerJoin(tags, eq(albumTags.tagId, tags.id))
            .where(eq(albumTags.albumId, album.id))

          return {
            ...album,
            models: albumModelRows.map((r) => r.model),
            tags: albumTagRows.map((r) => r.tag),
          }
        }),
      )

      // 查询总数
      const totalResult = await db
        .select({ count: count() })
        .from(albums)
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
        .from(albums)
        .where(eq(albums.id, input.id))
      const album = result[0]
      if (!album) return null

      // 获取关联的模特
      const albumModelRows = await db
        .select({ modelId: albumModels.modelId })
        .from(albumModels)
        .where(eq(albumModels.albumId, album.id))

      // 获取关联的标签
      const albumTagRows = await db
        .select({ tagId: albumTags.tagId })
        .from(albumTags)
        .where(eq(albumTags.albumId, album.id))

      return {
        ...album,
        modelIds: albumModelRows.map((r) => r.modelId),
        tagIds: albumTagRows.map((r) => r.tagId),
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        coverImageUrl: z.string().optional(),
        description: z.string().optional(),
        id: z.string(),
        modelIds: z.array(z.string()).optional(),
        publishedAt: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        title: z.string().min(1, '专辑标题不能为空').optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, modelIds, tagIds, ...data } = input

      // 更新专辑基本信息
      const result = await db
        .update(albums)
        .set({
          ...data,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(albums.id, id))
        .returning()

      // 更新模特关联
      if (modelIds !== undefined) {
        await db.delete(albumModels).where(eq(albumModels.albumId, id))
        if (modelIds.length > 0) {
          await db.insert(albumModels).values(
            modelIds.map((modelId) => ({
              albumId: id,
              modelId,
            })),
          )
        }
      }

      // 更新标签关联
      if (tagIds !== undefined) {
        await db.delete(albumTags).where(eq(albumTags.albumId, id))
        if (tagIds.length > 0) {
          await db.insert(albumTags).values(
            tagIds.map((tagId) => ({
              albumId: id,
              tagId,
            })),
          )
        }
      }

      return result[0]
    }),
}
