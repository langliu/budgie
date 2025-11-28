import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getUser } from '@/functions/get-user'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/short-videos')({
  component: ShortVideosRoute,
})

function ShortVideosRoute() {
  const [videoUrl, setVideoUrl] = useState('')
  const navigate = useNavigate()

  const videosQuery = useQuery(orpc.shortVideo.list.queryOptions())

  const createMutation = useMutation(
    orpc.shortVideo.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message || '解析视频失败')
      },
      onSuccess: () => {
        videosQuery.refetch()
        setVideoUrl('')
        toast.success('视频解析成功')
      },
    }),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!videoUrl.trim()) return

    try {
      const session = await getUser()
      if (!session) {
        toast.error('请先登录')
        navigate({ to: '/login' })
        return
      }
    } catch {
      // 如果服务端中间件直接抛出重定向或错误，视为未登录
      toast.error('请先登录')
      navigate({ to: '/login' })
      return
    }

    createMutation.mutate({ originalUrl: videoUrl })
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 font-bold text-2xl">短视频管理</h1>

      {/* 输入框 */}
      <form className="mb-8 flex items-center gap-4" onSubmit={handleSubmit}>
        <Input
          className="flex-1"
          disabled={createMutation.isPending}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="输入视频分享链接..."
          value={videoUrl}
        />
        <Button
          disabled={createMutation.isPending || !videoUrl.trim()}
          type="submit"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              解析中...
            </>
          ) : (
            '解析视频'
          )}
        </Button>
      </form>

      {/* 视频列表表格 */}
      {videosQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : videosQuery.data?.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          暂无视频，请在上方输入视频链接进行解析
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">标题</TableHead>
                <TableHead>标签</TableHead>
                <TableHead className="w-[100px]">视频</TableHead>
                <TableHead className="w-[180px]">创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videosQuery.data?.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {video.topics.map((topic) => (
                        <span
                          className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
                          key={topic.id}
                        >
                          {topic.description}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      className="text-primary hover:underline"
                      href={video.videoUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      查看视频
                    </a>
                  </TableCell>
                  <TableCell>
                    {video.createdAt
                      ? new Date(video.createdAt).toLocaleString('zh-CN')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
