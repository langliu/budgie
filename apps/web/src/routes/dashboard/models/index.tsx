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
} from 'lucide-react'
import { useState } from 'react'
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

export const Route = createFileRoute('/dashboard/models/')({
  component: ModelsPage,
})

function ModelsPage() {
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const models = useQuery(
    orpc.model.getAll.queryOptions({
      input: { keyword, page, pageSize },
    }),
  )
  const deleteMutation = useMutation(
    orpc.model.delete.mutationOptions({ onSuccess: () => models.refetch() }),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">模特管理</h1>
          <p className="text-muted-foreground">管理所有模特信息</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/models/new">
            <Plus className="mr-2 h-4 w-4" />
            添加模特
          </Link>
        </Button>
      </div>

      {/* 筛选区域 */}
      <Card>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索姓名或艺名..."
                value={searchInput}
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              搜索
            </Button>
            {keyword && (
              <Button
                onClick={() => {
                  setKeyword('')
                  setSearchInput('')
                  setPage(1)
                }}
                variant="ghost"
              >
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>模特列表</CardTitle>
          <CardDescription>
            共 {models.data?.total ?? 0} 位模特
            {keyword && `（筛选: "${keyword}"）`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {models.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : models.data?.data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {keyword ? '没有找到匹配的模特' : '暂无模特，点击上方按钮添加'}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>头像</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>艺名</TableHead>
                    <TableHead>简介</TableHead>
                    <TableHead>社交链接</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.data?.data.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>
                        {model.avatarUrl ? (
                          <img
                            alt={model.name}
                            className="h-10 w-10 rounded-full object-cover"
                            src={model.avatarUrl}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                            无
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {model.name}
                      </TableCell>
                      <TableCell>{model.alias || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {model.bio || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {model.weiboUrl && (
                            <a
                              className="text-blue-500 text-xs hover:underline"
                              href={model.weiboUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              微博
                            </a>
                          )}
                          {model.instagramUrl && (
                            <a
                              className="text-pink-500 text-xs hover:underline"
                              href={model.instagramUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              IG
                            </a>
                          )}
                          {model.xUrl && (
                            <a
                              className="text-xs hover:underline"
                              href={model.xUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              X
                            </a>
                          )}
                          {model.youtubeUrl && (
                            <a
                              className="text-red-500 text-xs hover:underline"
                              href={model.youtubeUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              YT
                            </a>
                          )}
                          {!model.weiboUrl &&
                            !model.instagramUrl &&
                            !model.xUrl &&
                            !model.youtubeUrl &&
                            '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(model.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button asChild size="icon" variant="ghost">
                            <Link
                              params={{ id: model.id }}
                              to="/dashboard/models/$id"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            onClick={() =>
                              deleteMutation.mutate({ id: model.id })
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
              {models.data && models.data.totalPages > 1 && (
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
                      第 {page} / {models.data.totalPages} 页
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
                      disabled={page >= models.data.totalPages}
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
