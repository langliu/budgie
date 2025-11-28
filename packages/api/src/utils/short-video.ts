export interface VideoInfo {
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
export async function getVideoInfo(
  link: string,
  token: string,
): Promise<VideoInfo> {
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

export interface ParsedVideoDesc {
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
export function parseVideoDesc(desc: string): ParsedVideoDesc {
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
