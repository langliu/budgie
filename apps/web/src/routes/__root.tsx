import type { QueryClient } from '@tanstack/react-query'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import type { orpc } from '@/utils/orpc'
import Header from '../components/header'
import appCss from '../index.css?url'

// 不显示 Header 的路由路径
const noHeaderRoutes = ['/login', '/register']

export interface RouterAppContext {
  orpc: typeof orpc
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootDocument,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: 'stylesheet',
      },
    ],
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        content: 'width=device-width, initial-scale=1',
        name: 'viewport',
      },
      {
        title: 'Budgie',
      },
    ],
  }),
})

function RootDocument() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showHeader = !noHeaderRoutes.includes(pathname)

  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <div
            className={showHeader ? 'grid h-svh grid-rows-[auto_1fr]' : 'h-svh'}
          >
            {showHeader && <Header />}
            <Outlet />
          </div>
          <Toaster richColors />
        </ThemeProvider>
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
        <Scripts />
      </body>
    </html>
  )
}
