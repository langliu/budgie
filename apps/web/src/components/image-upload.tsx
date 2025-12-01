import { useMutation } from '@tanstack/react-query'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

interface ImageUploadProps {
  disabled?: boolean
  folder?: string
  onChange: (url: string) => void
  value?: string
}

export function ImageUpload({
  disabled,
  folder = 'avatars',
  onChange,
  value,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)

  const uploadMutation = useMutation(
    orpc.upload.uploadFile.mutationOptions({
      onError: (error) => {
        toast.error(error.message || '上传失败')
      },
      onSuccess: (data) => {
        onChange(data.url)
        toast.success('上传成功')
      },
    }),
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件')
        return
      }

      // 验证文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过 5MB')
        return
      }

      // 显示预览
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setPreview(dataUrl)

        // 提取 base64 数据（去掉 data:image/xxx;base64, 前缀）
        const base64Data = dataUrl.split(',')[1]

        // 上传
        uploadMutation.mutate({
          contentType: file.type,
          data: base64Data,
          folder,
        })
      }
      reader.readAsDataURL(file)
    },
    [folder, uploadMutation],
  )

  const handleRemove = useCallback(() => {
    setPreview(null)
    onChange('')
  }, [onChange])

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {preview ? (
          <div className="relative">
            <img
              alt="预览"
              className="h-20 w-20 rounded-lg border object-cover"
              src={preview}
            />
            <Button
              className="-right-2 -top-2 absolute h-6 w-6 rounded-full"
              disabled={disabled || uploadMutation.isPending}
              onClick={handleRemove}
              size="icon"
              type="button"
              variant="destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <label
            className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50 ${
              disabled || uploadMutation.isPending
                ? 'cursor-not-allowed opacity-50'
                : ''
            }`}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="mt-1 text-muted-foreground text-xs">上传</span>
              </>
            )}
            <input
              accept="image/*"
              className="hidden"
              disabled={disabled || uploadMutation.isPending}
              onChange={handleFileChange}
              type="file"
            />
          </label>
        )}
      </div>
      {uploadMutation.isPending && (
        <span className="text-muted-foreground text-sm">上传中...</span>
      )}
    </div>
  )
}
