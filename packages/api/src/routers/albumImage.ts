import { env } from 'cloudflare:workers'
import { db } from '@budgie/db'
import { albumImages } from '@budgie/db/schema/model'
import { asc, eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import z from 'zod'
import { protectedProcedure } from '../index'

export const albumImageRouter = {
  /**
   * 批量添加图片到专辑
   */
  addImages: protectedProcedure
    .input(
      z.object({
        albumId: z.string(),
        images: z.array(
          z.object({
            caption: z.string().optional(),
            contentType: z.string(),
            data: z.string(), // base64 编码的图片
            fileSize: z.number().optional(),
            height: z.number().optional(),
            width: z.number().optional(),
          }),
        ),
      }),
    )
    .handler(async ({ input }) => {
      const { albumId, images } = input
      const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, '')

      // 获取当前最大 sortOrder
      const existingImages = await db
        .select({ sortOrder: albumImages.sortOrder })
        .from(albumImages)
        .where(eq(albumImages.albumId, albumId))
        .orderBy(asc(albumImages.sortOrder))
      const maxSortOrder =
        existingImages.length > 0
          ? Math.max(...existingImages.map((i) => i.sortOrder))
          : -1

      const results = []
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const extension = getExtensionFromContentType(image.contentType)
        const key = `albums/${albumId}/${uuidv7()}.${extension}`

        // 解码 base64 并上传到 R2
        const binaryString = atob(image.data)
        const bytes = new Uint8Array(binaryString.length)
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j)
        }

        await env.BUCKET.put(key, bytes.buffer, {
          httpMetadata: { contentType: image.contentType },
        })

        // 插入数据库记录
        const [inserted] = await db
          .insert(albumImages)
          .values({
            albumId,
            caption: image.caption,
            fileSize: image.fileSize,
            height: image.height,
            key,
            sortOrder: maxSortOrder + i + 1,
            url: `${baseUrl}/${key}`,
            width: image.width,
          })
          .returning()

        results.push(inserted)
      }

      return results
    }),

  /**
   * 删除单张图片
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      // 获取图片信息
      const [image] = await db
        .select()
        .from(albumImages)
        .where(eq(albumImages.id, input.id))

      if (image) {
        // 从 R2 删除文件
        await env.BUCKET.delete(image.key)
        // 从数据库删除记录
        await db.delete(albumImages).where(eq(albumImages.id, input.id))
      }

      return { success: true }
    }),

  /**
   * 获取专辑的所有图片
   */
  getByAlbumId: protectedProcedure
    .input(z.object({ albumId: z.string() }))
    .handler(async ({ input }) => {
      return await db
        .select()
        .from(albumImages)
        .where(eq(albumImages.albumId, input.albumId))
        .orderBy(asc(albumImages.sortOrder))
    }),

  /**
   * 更新图片信息（描述、排序等）
   */
  update: protectedProcedure
    .input(
      z.object({
        caption: z.string().optional(),
        id: z.string(),
        sortOrder: z.number().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input
      const [updated] = await db
        .update(albumImages)
        .set(data)
        .where(eq(albumImages.id, id))
        .returning()
      return updated
    }),

  /**
   * 批量更新排序
   */
  updateSortOrder: protectedProcedure
    .input(
      z.object({
        images: z.array(
          z.object({
            id: z.string(),
            sortOrder: z.number(),
          }),
        ),
      }),
    )
    .handler(async ({ input }) => {
      for (const image of input.images) {
        await db
          .update(albumImages)
          .set({ sortOrder: image.sortOrder })
          .where(eq(albumImages.id, image.id))
      }
      return { success: true }
    }),
}

function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
  }
  return map[contentType] || 'bin'
}
