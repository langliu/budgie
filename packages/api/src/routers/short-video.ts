import { env } from 'cloudflare:workers'
import { db } from '@budgie/db'
import {
  shortVideo,
  shortVideoTopic,
  shortVideoToTopic,
} from '@budgie/db/schema/short-video'
import { eq } from 'drizzle-orm'
import { v7 as uuidv7 } from 'uuid'
import z from 'zod'
import { publicProcedure } from '../index'
import { getVideoInfo, parseVideoDesc } from '../utils'

/**
 * 下载视频并上传到 R2
 */
async function uploadVideoToR2(
  videoUrl: string,
  fileName: string,
): Promise<{ key: string; size: number }> {
  // 下载视频
  const videoResponse = await fetch(videoUrl, {
    headers: {
      // 模拟浏览器请求，避免被拒绝
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  if (!videoResponse.ok) {
    throw new Error(`下载视频失败: ${videoResponse.status}`)
  }

  const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
  const videoBuffer = await videoResponse.arrayBuffer()

  // 生成唯一的文件名
  const timestamp = Date.now()
  const key = `short-videos/${timestamp}-${fileName}.mp4`

  // 上传到 R2
  await env.BUCKET.put(key, videoBuffer, {
    httpMetadata: {
      contentType,
    },
  })

  return {
    key,
    size: videoBuffer.byteLength,
  }
}

/**
 * 获取或创建 topic，返回 topic id 列表
 */
async function getOrCreateTopics(tags: string[]): Promise<string[]> {
  if (tags.length === 0) return []

  const topicIds: string[] = []

  for (const tag of tags) {
    // 查找已存在的 topic
    const existingTopic = await db
      .select()
      .from(shortVideoTopic)
      .where(eq(shortVideoTopic.description, tag))
      .limit(1)

    if (existingTopic.length > 0 && existingTopic[0]) {
      topicIds.push(existingTopic[0].id)
    } else {
      // 创建新的 topic
      const newTopic = await db
        .insert(shortVideoTopic)
        .values({ description: tag })
        .returning()

      if (newTopic[0]) {
        topicIds.push(newTopic[0].id)
      }
    }
  }

  return topicIds
}

/**
 * 关联视频和 topics
 */
async function linkVideoToTopics(
  videoId: string,
  topicIds: string[],
): Promise<void> {
  if (topicIds.length === 0) return

  const relations = topicIds.map((topicId) => ({
    topicId,
    videoId,
  }))

  await db.insert(shortVideoToTopic).values(relations)
}

export const shortVideoRouter = {
  /**
   * 解析并转存短视频到 R2
   */
  create: publicProcedure
    .input(z.object({ originalUrl: z.string().min(10) }))
    .handler(async ({ input }) => {
      const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, '') // 移除末尾斜杠

      // 1. 检查数据库中是否已存在该视频
      const existingVideo = await db.query.shortVideo.findFirst({
        where: eq(shortVideo.originalUrl, input.originalUrl),
        with: {
          videoToTopics: {
            with: {
              topic: true,
            },
          },
        },
      })

      if (existingVideo) {
        // 已存在，直接返回
        return {
          ...existingVideo,
          coverUrl: null, // 暂不支持封面查询，需要额外存储
          topics: existingVideo.videoToTopics.map((vt) => vt.topic),
          videoUrl: `${baseUrl}/${existingVideo.r2Key}`,
        }
      }

      // 2. 解析视频链接
      const videoInfo = await getVideoInfo(
        input.originalUrl,
        env.SHORT_VIDEO_TOKEN,
      )

      // 3. 生成文件名
      const fileName = uuidv7()

      // 4. 上传视频到 R2
      const videoResult = await uploadVideoToR2(videoInfo.playAddr, fileName)

      // 6. 解析标题和标签
      const { title, tags } = parseVideoDesc(videoInfo.desc)

      // 7. 获取或创建 topics
      const topicIds = await getOrCreateTopics(tags)

      // 8. 插入视频记录到数据库
      const [insertedVideo] = await db
        .insert(shortVideo)
        .values({
          name: title,
          originalUrl: input.originalUrl,
          r2Key: videoResult.key,
        })
        .returning()

      // 9. 关联视频和 topics
      if (insertedVideo) {
        await linkVideoToTopics(insertedVideo.id, topicIds)
      }

      // 10. 查询完整的视频信息（包含关联的 topics）
      const videoWithTopics = insertedVideo
        ? await db.query.shortVideo.findFirst({
            where: eq(shortVideo.id, insertedVideo.id),
            with: {
              videoToTopics: {
                with: {
                  topic: true,
                },
              },
            },
          })
        : null

      return {
        ...videoWithTopics,
        topics: videoWithTopics?.videoToTopics.map((vt) => vt.topic) ?? [],
        videoUrl: `${baseUrl}/${videoResult.key}`,
      }
    }),

  /**
   * 获取 R2 文件的公开访问 URL
   */
  getFileUrl: publicProcedure
    .input(z.object({ key: z.string() }))
    .handler(async ({ input }) => {
      const object = await env.BUCKET.head(input.key)
      if (!object) {
        throw new Error('文件不存在')
      }
      const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, '')
      return {
        key: input.key,
        size: object.size,
        url: `${baseUrl}/${input.key}`,
      }
    }),

  /**
   * 获取所有视频列表
   */
  list: publicProcedure.handler(async () => {
    const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, '')

    const videos = await db.query.shortVideo.findMany({
      orderBy: (shortVideo, { desc }) => [desc(shortVideo.createdAt)],
      with: {
        videoToTopics: {
          with: {
            topic: true,
          },
        },
      },
    })

    return videos.map((video) => ({
      ...video,
      topics: video.videoToTopics.map((vt) => vt.topic),
      videoUrl: `${baseUrl}/${video.r2Key}`,
    }))
  }),
}
