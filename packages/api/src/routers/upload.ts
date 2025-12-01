import { env } from 'cloudflare:workers'
import { v7 as uuidv7 } from 'uuid'
import z from 'zod'
import { protectedProcedure } from '../index'

export const uploadRouter = {
  /**
   * 获取预签名上传 URL（用于直接从浏览器上传到 R2）
   */
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        contentType: z.string(),
        folder: z.string().default('uploads'),
      }),
    )
    .handler(async ({ input }) => {
      const { contentType, folder } = input
      const extension = contentType.split('/')[1] || 'bin'
      const key = `${folder}/${uuidv7()}.${extension}`

      // R2 Bucket 需要通过 createPresignedUrl 方法创建预签名 URL
      // 但 Workers 绑定的 R2 不直接支持预签名 URL
      // 我们返回一个上传端点，让前端通过我们的 API 上传

      return {
        key,
        uploadUrl: `/api/upload/${key}`,
      }
    }),

  /**
   * 直接上传文件到 R2
   * 接收 base64 编码的文件内容
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        contentType: z.string(),
        data: z.string(), // base64 编码的文件内容
        folder: z.string().default('uploads'),
      }),
    )
    .handler(async ({ input }) => {
      const { contentType, data, folder } = input
      const extension = getExtensionFromContentType(contentType)
      const key = `${folder}/${uuidv7()}.${extension}`

      // 解码 base64
      const binaryString = atob(data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // 上传到 R2
      await env.BUCKET.put(key, bytes.buffer, {
        httpMetadata: {
          contentType,
        },
      })

      const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, '')

      return {
        key,
        url: `${baseUrl}/${key}`,
      }
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
