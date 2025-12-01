import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ImageUpload } from '@/components/image-upload'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ModelFormData = {
  alias: string
  avatarUrl: string
  bio: string
  homepageUrl: string
  instagramUrl: string
  name: string
  weiboUrl: string
  xUrl: string
  youtubeUrl: string
}

export const initialModelFormData: ModelFormData = {
  alias: '',
  avatarUrl: '',
  bio: '',
  homepageUrl: '',
  instagramUrl: '',
  name: '',
  weiboUrl: '',
  xUrl: '',
  youtubeUrl: '',
}

interface ModelFormProps {
  defaultValues?: ModelFormData
  isPending?: boolean
  onCancel?: () => void
  onSubmit: (data: ModelFormData) => void
  title: string
}

export function ModelForm({
  defaultValues = initialModelFormData,
  isPending = false,
  onCancel,
  onSubmit,
  title,
}: ModelFormProps) {
  const [formData, setFormData] = useState<ModelFormData>(defaultValues)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>填写模特基本信息</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="请输入模特姓名"
                value={formData.name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alias">艺名</Label>
              <Input
                id="alias"
                onChange={(e) =>
                  setFormData((p) => ({ ...p, alias: e.target.value }))
                }
                placeholder="请输入艺名"
                value={formData.alias}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>头像</Label>
            <ImageUpload
              folder="avatars"
              onChange={(url) => setFormData((p) => ({ ...p, avatarUrl: url }))}
              value={formData.avatarUrl}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">简介</Label>
            <Textarea
              id="bio"
              onChange={(e) =>
                setFormData((p) => ({ ...p, bio: e.target.value }))
              }
              placeholder="请输入简介"
              rows={4}
              value={formData.bio}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="homepageUrl">个人主页</Label>
            <Input
              id="homepageUrl"
              onChange={(e) =>
                setFormData((p) => ({ ...p, homepageUrl: e.target.value }))
              }
              placeholder="请输入个人主页URL"
              type="url"
              value={formData.homepageUrl}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weiboUrl">微博</Label>
              <Input
                id="weiboUrl"
                onChange={(e) =>
                  setFormData((p) => ({ ...p, weiboUrl: e.target.value }))
                }
                placeholder="微博主页URL"
                type="url"
                value={formData.weiboUrl}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                onChange={(e) =>
                  setFormData((p) => ({ ...p, instagramUrl: e.target.value }))
                }
                placeholder="Instagram URL"
                type="url"
                value={formData.instagramUrl}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="xUrl">X (Twitter)</Label>
              <Input
                id="xUrl"
                onChange={(e) =>
                  setFormData((p) => ({ ...p, xUrl: e.target.value }))
                }
                placeholder="X 主页URL"
                type="url"
                value={formData.xUrl}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="youtubeUrl">YouTube</Label>
              <Input
                id="youtubeUrl"
                onChange={(e) =>
                  setFormData((p) => ({ ...p, youtubeUrl: e.target.value }))
                }
                placeholder="YouTube 频道URL"
                type="url"
                value={formData.youtubeUrl}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button onClick={onCancel} type="button" variant="outline">
                取消
              </Button>
            )}
            <Button disabled={isPending || !formData.name.trim()} type="submit">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
