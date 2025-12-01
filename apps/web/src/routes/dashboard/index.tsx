import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BookImage, Tag, User } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { orpc } from '@/utils/orpc'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
})

function DashboardIndex() {
  const { session } = Route.useRouteContext()
  const models = useQuery(orpc.model.getAll.queryOptions({ input: {} }))
  const albums = useQuery(orpc.album.getAll.queryOptions({ input: {} }))
  const tags = useQuery(orpc.tag.getAll.queryOptions())

  const stats = [
    {
      count: models.data?.total ?? 0,
      description: '已添加的模特数量',
      href: '/dashboard/models',
      icon: User,
      title: '模特',
    },
    {
      count: albums.data?.total ?? 0,
      description: '已创建的专辑数量',
      href: '/dashboard/albums',
      icon: BookImage,
      title: '专辑',
    },
    {
      count: tags.data?.length ?? 0,
      description: '可用的标签数量',
      href: '/dashboard/tags',
      icon: Tag,
      title: '标签',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl">欢迎回来，{session?.user?.name}</h1>
        <p className="text-muted-foreground">这是您的管理面板概览</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.href} to={stat.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stat.count}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
