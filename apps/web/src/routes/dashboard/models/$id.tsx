import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModelForm, type ModelFormData } from '@/components/model-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard/models/$id')({
  component: EditModelPage,
})

function EditModelPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const modelQuery = useQuery(
    orpc.model.getById.queryOptions({ input: { id } }),
  )

  const updateMutation = useMutation(
    orpc.model.update.mutationOptions({
      onError: (error) => {
        toast.error(error.message || '更新失败')
      },
      onSuccess: () => {
        toast.success('模特信息已更新')
        navigate({ to: '/dashboard/models' })
      },
    }),
  )

  const handleSubmit = (data: ModelFormData) => {
    updateMutation.mutate({
      alias: data.alias || undefined,
      avatarUrl: data.avatarUrl || undefined,
      bio: data.bio || undefined,
      homepageUrl: data.homepageUrl || undefined,
      id,
      instagramUrl: data.instagramUrl || undefined,
      name: data.name,
      weiboUrl: data.weiboUrl || undefined,
      xUrl: data.xUrl || undefined,
      youtubeUrl: data.youtubeUrl || undefined,
    })
  }

  if (modelQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!modelQuery.data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: '/dashboard/models' })}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-3xl">模特不存在</h1>
            <p className="text-muted-foreground">无法找到该模特信息</p>
          </div>
        </div>
      </div>
    )
  }

  const defaultValues: ModelFormData = {
    alias: modelQuery.data.alias || '',
    avatarUrl: modelQuery.data.avatarUrl || '',
    bio: modelQuery.data.bio || '',
    homepageUrl: modelQuery.data.homepageUrl || '',
    instagramUrl: modelQuery.data.instagramUrl || '',
    name: modelQuery.data.name,
    weiboUrl: modelQuery.data.weiboUrl || '',
    xUrl: modelQuery.data.xUrl || '',
    youtubeUrl: modelQuery.data.youtubeUrl || '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate({ to: '/dashboard/models' })}
          size="icon"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-bold text-3xl">编辑模特</h1>
          <p className="text-muted-foreground">修改模特信息</p>
        </div>
      </div>

      <ModelForm
        defaultValues={defaultValues}
        isPending={updateMutation.isPending}
        onCancel={() => navigate({ to: '/dashboard/models' })}
        onSubmit={handleSubmit}
        title="模特信息"
      />
    </div>
  )
}
