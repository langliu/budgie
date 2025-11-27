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

interface VideoInfo {
  cover: null | string
  /** 视频标题 */
  desc: string
  music: string
  pics: null
  /** 解析后的无水印视频地址 */
  playAddr: string
  size: null
  type: null
  videos: null
}

/**
 * 解析短视频链接，获取无水印视频信息
 */
async function getVideoInfo(link: string, token: string): Promise<VideoInfo> {
  const backendApiUrl = 'https://proxy.layzz.cn/lyz/platAnalyse/'

  const params = new URLSearchParams()
  params.append('link', link)
  params.append('token', token)

  const response = await fetch(backendApiUrl, {
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })

  const data: {
    code: string
    data: VideoInfo
  } = await response.json()

  if (!response.ok || data.code !== '0001') {
    throw new Error(`解析失败：${link}`)
  }

  return data.data
}

interface ParsedVideoDesc {
  /** 视频标签列表 */
  tags: string[]
  /** 视频真正的标题 */
  title: string
}

/**
 * 解析视频描述，分离标题和标签
 * @example
 * parseVideoDesc("猫猫凝视 #少女感 #二次元 #动漫")
 * // => { title: "猫猫凝视", tags: ["少女感", "二次元", "动漫"] }
 */
function parseVideoDesc(desc: string): ParsedVideoDesc {
  if (!desc) {
    return { tags: [], title: '' }
  }

  // 匹配所有 #标签（支持中文、英文、数字、下划线）
  const tagRegex = /#([\w\u4e00-\u9fa5]+)/g
  const tags: string[] = []
  let match: RegExpExecArray | null

  // 使用显式赋值以避免在表达式中做赋值
  while (true) {
    match = tagRegex.exec(desc)
    if (match === null) break
    if (match[1]) {
      tags.push(match[1])
    }
  }

  // 移除所有标签，剩下的就是标题
  const title = desc
    .replace(/#[\w\u4e00-\u9fa5]+/g, '') // 移除标签
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()

  return { tags, title }
}

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
 * 下载封面并上传到 R2
 */
async function uploadCoverToR2(
  coverUrl: string,
  fileName: string,
): Promise<{ key: string; size: number } | null> {
  if (!coverUrl) return null

  try {
    const coverResponse = await fetch(coverUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!coverResponse.ok) {
      console.error(`下载封面失败: ${coverResponse.status}`)
      return null
    }

    const contentType =
      coverResponse.headers.get('content-type') || 'image/jpeg'
    const coverBuffer = await coverResponse.arrayBuffer()

    const timestamp = Date.now()
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const key = `covers/${timestamp}-${fileName}.${ext}`

    await env.BUCKET.put(key, coverBuffer, {
      httpMetadata: {
        contentType,
      },
    })

    return {
      key,
      size: coverBuffer.byteLength,
    }
  } catch (error) {
    console.error('上传封面失败:', error)
    return null
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

      // 5. 上传封面到 R2（如果有）
      const coverResult = videoInfo.cover
        ? await uploadCoverToR2(videoInfo.cover, fileName)
        : null

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
        coverUrl: coverResult ? `${baseUrl}/${coverResult.key}` : null,
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
