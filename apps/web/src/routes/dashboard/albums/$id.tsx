import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AlbumForm, type AlbumFormData } from '@/components/album-form'
import { AlbumImagesUpload } from '@/components/album-images-upload'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard/albums/$id')({
  component: EditAlbumPage,
})

function EditAlbumPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const album = useQuery(
    orpc.album.getById.queryOptions({
      input: { id },
    }),
  )

  const updateMutation = useMutation(
    orpc.album.update.mutationOptions({
      onError: (error) => {
        toast.error(error.message || '更新失败')
      },
      onSuccess: () => {
        toast.success('专辑更新成功')
        navigate({ to: '/dashboard/albums' })
      },
    }),
  )

  const handleSubmit = (data: AlbumFormData) => {
    updateMutation.mutate({
      coverImageUrl: data.coverImageUrl || undefined,
      description: data.description || undefined,
      id,
      modelIds: data.modelIds.length > 0 ? data.modelIds : undefined,
      publishedAt: data.publishedAt || undefined,
      tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
      title: data.title,
    })
  }

  if (album.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!album.data) {
    return (
      <div className="py-8 text-center text-muted-foreground">专辑不存在</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate({ to: '/dashboard/albums' })}
          size="icon"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-bold text-3xl">编辑专辑</h1>
          <p className="text-muted-foreground">修改专辑信息</p>
        </div>
      </div>

      <AlbumForm
        defaultValues={{
          coverImageUrl: album.data.coverImageUrl ?? '',
          description: album.data.description ?? '',
          modelIds: album.data.modelIds ?? [],
          publishedAt:
            album.data.publishedAt instanceof Date
              ? album.data.publishedAt.toISOString().split('T')[0]
              : (album.data.publishedAt ?? ''),
          tagIds: album.data.tagIds ?? [],
          title: album.data.title,
        }}
        isPending={updateMutation.isPending}
        onCancel={() => navigate({ to: '/dashboard/albums' })}
        onSubmit={handleSubmit}
        title="编辑专辑信息"
      />

      {/* 专辑图片管理 */}
      <Card>
        <CardHeader>
          <CardTitle>专辑图片</CardTitle>
          <CardDescription>管理专辑中的所有图片，支持批量上传</CardDescription>
        </CardHeader>
        <CardContent>
          <AlbumImagesUpload albumId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
