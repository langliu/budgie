import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { BookImage, Home, Tag, User } from 'lucide-react'
import { getUser } from '@/functions/get-user'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getUser()
    return { session }
  },
  component: DashboardLayout,
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: '/login',
      })
    }
  },
})

const navItems = [
  { href: '/dashboard', icon: Home, label: '概览' },
  { href: '/dashboard/models', icon: User, label: '模特管理' },
  { href: '/dashboard/albums', icon: BookImage, label: '专辑管理' },
  { href: '/dashboard/tags', icon: Tag, label: '标签管理' },
]

function DashboardLayout() {
  return (
    <div className="flex h-full">
      {/* 侧边栏 */}
      <aside className="w-64 border-r bg-muted/40">
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => (
            <Link
              activeOptions={{ exact: item.href === '/dashboard' }}
              activeProps={{
                className: 'bg-primary text-primary-foreground',
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              key={item.href}
              to={item.href}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
