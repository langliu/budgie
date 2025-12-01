import { useMutation, useQuery } from '@tanstack/react-query'
import { GripVertical, Loader2, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

interface AlbumImagesUploadProps {
  albumId: string
}

interface PendingImage {
  data: string // base64
  file: File
  id: string
  preview: string
}

export function AlbumImagesUpload({ albumId }: AlbumImagesUploadProps) {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // 获取已上传的图片
  const imagesQuery = useQuery(
    orpc.albumImage.getByAlbumId.queryOptions({ input: { albumId } }),
  )

  // 上传图片
  const uploadMutation = useMutation(
    orpc.albumImage.addImages.mutationOptions({
      onSuccess: () => {
        setPendingImages([])
        imagesQuery.refetch()
      },
    }),
  )

  // 删除图片
  const deleteMutation = useMutation(
    orpc.albumImage.delete.mutationOptions({
      onSuccess: () => imagesQuery.refetch(),
    }),
  )

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    )

    imageFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        setPendingImages((prev) => [
          ...prev,
          {
            data: base64,
            file,
            id: crypto.randomUUID(),
            preview: result,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleUpload = () => {
    if (pendingImages.length === 0) return

    uploadMutation.mutate({
      albumId,
      images: pendingImages.map((img) => ({
        contentType: img.file.type,
        data: img.data,
        fileSize: img.file.size,
      })),
    })
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      {/** biome-ignore lint/a11y/noStaticElementInteractions: 暂时忽略 */}
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground text-sm">
          拖拽图片到这里，或{' '}
          <label className="cursor-pointer text-primary hover:underline">
            点击选择
            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              type="file"
            />
          </label>
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          支持 JPG、PNG、GIF、WebP 格式
        </p>
      </div>

      {/* 待上传的图片预览 */}
      {pendingImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              待上传 ({pendingImages.length} 张)
            </h4>
            <Button
              disabled={uploadMutation.isPending}
              onClick={handleUpload}
              size="sm"
            >
              {uploadMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              确认上传
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {pendingImages.map((img) => (
              <div className="group relative" key={img.id}>
                <img
                  alt="待上传"
                  className="h-24 w-full rounded-md object-cover"
                  src={img.preview}
                />
                <button
                  className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removePendingImage(img.id)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已上传的图片 */}
      {imagesQuery.isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : imagesQuery.data && imagesQuery.data.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            已上传 ({imagesQuery.data.length} 张)
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {imagesQuery.data.map((image) => (
              <div className="group relative" key={image.id}>
                <img
                  alt={image.caption || '专辑图片'}
                  className="h-24 w-full rounded-md object-cover"
                  src={image.url}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-md bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-4 w-4 cursor-move text-white" />
                  <button
                    className="rounded p-0.5 text-white hover:bg-white/20"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ id: image.id })}
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
