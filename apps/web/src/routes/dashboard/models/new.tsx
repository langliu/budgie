import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { ModelForm, type ModelFormData } from '@/components/model-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard/models/new')({
  component: NewModelPage,
})

function NewModelPage() {
  const navigate = useNavigate()

  const createMutation = useMutation(
    orpc.model.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message || '创建失败')
      },
      onSuccess: () => {
        toast.success('模特创建成功')
        navigate({ to: '/dashboard/models' })
      },
    }),
  )

  const handleSubmit = (data: ModelFormData) => {
    createMutation.mutate({
      alias: data.alias || undefined,
      avatarUrl: data.avatarUrl || undefined,
      bio: data.bio || undefined,
      homepageUrl: data.homepageUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      name: data.name,
      weiboUrl: data.weiboUrl || undefined,
      xUrl: data.xUrl || undefined,
      youtubeUrl: data.youtubeUrl || undefined,
    })
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
          <h1 className="font-bold text-3xl">添加模特</h1>
          <p className="text-muted-foreground">创建新的模特信息</p>
        </div>
      </div>

      <ModelForm
        isPending={createMutation.isPending}
        onCancel={() => navigate({ to: '/dashboard/models' })}
        onSubmit={handleSubmit}
        title="模特信息"
      />
    </div>
  )
}
