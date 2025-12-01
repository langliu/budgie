import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard/albums/')({
  component: AlbumsPage,
})

function AlbumsPage() {
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [selectedTagId, setSelectedTagId] = useState<string>('')

  // 获取模特和标签列表用于筛选
  const modelsQuery = useQuery(
    orpc.model.getAll.queryOptions({
      input: { page: 1, pageSize: 100 },
    }),
  )
  const tagsQuery = useQuery(orpc.tag.getAll.queryOptions())

  const albums = useQuery(
    orpc.album.getAll.queryOptions({
      input: {
        keyword,
        modelId: selectedModelId || undefined,
        page,
        pageSize,
        tagId: selectedTagId || undefined,
      },
    }),
  )
  const deleteMutation = useMutation(
    orpc.album.delete.mutationOptions({ onSuccess: () => albums.refetch() }),
  )

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  const handleClearFilters = () => {
    setKeyword('')
    setSearchInput('')
    setSelectedModelId('')
    setSelectedTagId('')
    setPage(1)
  }

  const hasFilters = keyword || selectedModelId || selectedTagId

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">专辑管理</h1>
          <p className="text-muted-foreground">管理所有专辑信息</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/albums/new">
            <Plus className="mr-2 h-4 w-4" />
            添加专辑
          </Link>
        </Button>
      </div>

      {/* 筛选区域 */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索标题或描述..."
                value={searchInput}
              />
            </div>
            <Select
              onValueChange={(value) => {
                setSelectedModelId(value === 'all' ? '' : value)
                setPage(1)
              }}
              value={selectedModelId || 'all'}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择模特" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模特</SelectItem>
                {modelsQuery.data?.data.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                    {model.alias && ` (${model.alias})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => {
                setSelectedTagId(value === 'all' ? '' : value)
                setPage(1)
              }}
              value={selectedTagId || 'all'}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                {tagsQuery.data?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="secondary">
              搜索
            </Button>
            {hasFilters && (
              <Button onClick={handleClearFilters} variant="ghost">
                <X className="mr-1 h-4 w-4" />
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>专辑列表</CardTitle>
          <CardDescription>
            共 {albums.data?.total ?? 0} 个专辑
            {keyword && `（筛选: "${keyword}"）`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {albums.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : albums.data?.data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {keyword ? '没有找到匹配的专辑' : '暂无专辑，点击上方按钮添加'}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>封面</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>模特</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead>发布日期</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {albums.data?.data.map((album) => (
                    <TableRow key={album.id}>
                      <TableCell>
                        {album.coverImageUrl ? (
                          <img
                            alt={album.title}
                            className="h-10 w-10 rounded object-cover"
                            src={album.coverImageUrl}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground text-xs">
                            无
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {album.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {album.models.length > 0
                            ? album.models.map((model) => (
                                <Badge key={model.id} variant="secondary">
                                  {model.name}
                                </Badge>
                              ))
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {album.tags.length > 0
                            ? album.tags.map((tag) => (
                                <Badge key={tag.id} variant="outline">
                                  {tag.name}
                                </Badge>
                              ))
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {album.publishedAt
                          ? new Date(album.publishedAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(album.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button asChild size="icon" variant="ghost">
                            <Link
                              params={{ id: album.id }}
                              to="/dashboard/albums/$id"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            onClick={() =>
                              deleteMutation.mutate({ id: album.id })
                            }
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {albums.data && albums.data.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span>每页</span>
                    <Select
                      onValueChange={handlePageSizeChange}
                      value={String(pageSize)}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>条</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      第 {page} / {albums.data.totalPages} 页
                    </span>
                    <Button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      size="icon"
                      variant="outline"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      disabled={page >= albums.data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      size="icon"
                      variant="outline"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
