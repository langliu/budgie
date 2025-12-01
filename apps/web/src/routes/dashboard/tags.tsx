import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard/tags')({
  component: TagsPage,
})

function TagsPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const tags = useQuery(orpc.tag.getAll.queryOptions())
  const createMutation = useMutation(
    orpc.tag.create.mutationOptions({
      onSuccess: () => {
        tags.refetch()
        setOpen(false)
        setName('')
      },
    }),
  )
  const deleteMutation = useMutation(
    orpc.tag.delete.mutationOptions({ onSuccess: () => tags.refetch() }),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">标签管理</h1>
          <p className="text-muted-foreground">管理所有标签信息</p>
        </div>
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加标签
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>添加标签</DialogTitle>
                <DialogDescription>填写标签信息</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">标签名 *</Label>
                  <Input
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入标签名，如：日系、泳装"
                    value={name}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={createMutation.isPending || !name.trim()}
                  type="submit"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  保存
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>标签列表</CardTitle>
          <CardDescription>共 {tags.data?.length ?? 0} 个标签</CardDescription>
        </CardHeader>
        <CardContent>
          {tags.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tags.data?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              暂无标签，点击上方按钮添加
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标签名</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.data?.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => deleteMutation.mutate({ id: tag.id })}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
