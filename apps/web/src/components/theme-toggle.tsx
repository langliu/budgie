'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Sun className="dark:-rotate-90 h-5 w-5 rotate-0 scale-100 transition-all dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className={theme === 'light' ? 'bg-accent' : ''}
          onClick={() => setTheme('light')}
        >
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem
          className={theme === 'dark' ? 'bg-accent' : ''}
          onClick={() => setTheme('dark')}
        >
          深色
        </DropdownMenuItem>
        <DropdownMenuItem
          className={theme === 'system' ? 'bg-accent' : ''}
          onClick={() => setTheme('system')}
        >
          跟随系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
