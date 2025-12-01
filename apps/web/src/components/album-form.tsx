import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { ImageUpload } from '@/components/image-upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { orpc } from '@/utils/orpc'

export type AlbumFormData = {
  coverImageUrl: string
  description: string
  modelIds: string[]
  publishedAt: string
  tagIds: string[]
  title: string
}

export const initialAlbumFormData: AlbumFormData = {
  coverImageUrl: '',
  description: '',
  modelIds: [],
  publishedAt: '',
  tagIds: [],
  title: '',
}

interface AlbumFormProps {
  defaultValues?: AlbumFormData
  isPending?: boolean
  onCancel?: () => void
  onSubmit: (data: AlbumFormData) => void
  title: string
}

export function AlbumForm({
  defaultValues = initialAlbumFormData,
  isPending = false,
  onCancel,
  onSubmit,
  title,
}: AlbumFormProps) {
  const [formData, setFormData] = useState<AlbumFormData>(defaultValues)
  const [modelOpen, setModelOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)

  // 获取所有模特和标签列表
  const modelsQuery = useQuery(
    orpc.model.getAll.queryOptions({
      input: { page: 1, pageSize: 100 },
    }),
  )
  const tagsQuery = useQuery(orpc.tag.getAll.queryOptions())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    onSubmit(formData)
  }

  const toggleModel = (modelId: string) => {
    setFormData((p) => ({
      ...p,
      modelIds: p.modelIds.includes(modelId)
        ? p.modelIds.filter((id) => id !== modelId)
        : [...p.modelIds, modelId],
    }))
  }

  const toggleTag = (tagId: string) => {
    setFormData((p) => ({
      ...p,
      tagIds: p.tagIds.includes(tagId)
        ? p.tagIds.filter((id) => id !== tagId)
        : [...p.tagIds, tagId],
    }))
  }

  const selectedModels =
    modelsQuery.data?.data.filter((m) => formData.modelIds.includes(m.id)) ?? []
  const selectedTags =
    tagsQuery.data?.filter((t) => formData.tagIds.includes(t.id)) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>填写专辑基本信息</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="请输入专辑标题"
              value={formData.title}
            />
          </div>

          <div className="grid gap-2">
            <Label>封面图</Label>
            <ImageUpload
              folder="covers"
              onChange={(url) =>
                setFormData((p) => ({ ...p, coverImageUrl: url }))
              }
              value={formData.coverImageUrl}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="请输入专辑描述"
              rows={4}
              value={formData.description}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="publishedAt">发布日期</Label>
            <Input
              id="publishedAt"
              onChange={(e) =>
                setFormData((p) => ({ ...p, publishedAt: e.target.value }))
              }
              type="date"
              value={formData.publishedAt}
            />
          </div>

          {/* 模特选择 */}
          <div className="grid gap-2">
            <Label>关联模特</Label>
            <Popover onOpenChange={setModelOpen} open={modelOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="w-full justify-between"
                  role="combobox"
                  variant="outline"
                >
                  {selectedModels.length > 0
                    ? `已选择 ${selectedModels.length} 位模特`
                    : '选择模特...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="搜索模特..." />
                  <CommandList>
                    <CommandEmpty>未找到模特</CommandEmpty>
                    <CommandGroup>
                      {modelsQuery.data?.data.map((model) => (
                        <CommandItem
                          key={model.id}
                          onSelect={() => toggleModel(model.id)}
                          value={model.name}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.modelIds.includes(model.id)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {model.name}
                          {model.alias && (
                            <span className="ml-2 text-muted-foreground">
                              ({model.alias})
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedModels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedModels.map((model) => (
                  <Badge key={model.id} variant="secondary">
                    {model.name}
                    <button
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => toggleModel(model.id)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 标签选择 */}
          <div className="grid gap-2">
            <Label>关联标签</Label>
            <Popover onOpenChange={setTagOpen} open={tagOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="w-full justify-between"
                  role="combobox"
                  variant="outline"
                >
                  {selectedTags.length > 0
                    ? `已选择 ${selectedTags.length} 个标签`
                    : '选择标签...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="搜索标签..." />
                  <CommandList>
                    <CommandEmpty>未找到标签</CommandEmpty>
                    <CommandGroup>
                      {tagsQuery.data?.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => toggleTag(tag.id)}
                          value={tag.name}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.tagIds.includes(tag.id)
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {tag.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.name}
                    <button
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => toggleTag(tag.id)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button onClick={onCancel} type="button" variant="outline">
                取消
              </Button>
            )}
            <Button
              disabled={isPending || !formData.title.trim()}
              type="submit"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
