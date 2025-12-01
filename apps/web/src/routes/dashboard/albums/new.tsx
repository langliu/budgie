import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { AlbumForm, type AlbumFormData } from '@/components/album-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard/albums/new')({
  component: NewAlbumPage,
})

function NewAlbumPage() {
  const navigate = useNavigate()

  const createMutation = useMutation(
    orpc.album.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message || '创建失败')
      },
      onSuccess: () => {
        toast.success('专辑创建成功')
        navigate({ to: '/dashboard/albums' })
      },
    }),
  )

  const handleSubmit = (data: AlbumFormData) => {
    createMutation.mutate({
      coverImageUrl: data.coverImageUrl || undefined,
      description: data.description || undefined,
      modelIds: data.modelIds.length > 0 ? data.modelIds : undefined,
      publishedAt: data.publishedAt || undefined,
      tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
      title: data.title,
    })
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
          <h1 className="font-bold text-3xl">添加专辑</h1>
          <p className="text-muted-foreground">创建新的专辑</p>
        </div>
      </div>

      <AlbumForm
        isPending={createMutation.isPending}
        onCancel={() => navigate({ to: '/dashboard/albums' })}
        onSubmit={handleSubmit}
        title="专辑信息"
      />
    </div>
  )
}
