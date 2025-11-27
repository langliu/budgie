import alchemy from 'alchemy'
import { D1Database, R2Bucket, TanStackStart, Worker } from 'alchemy/cloudflare'
import { config } from 'dotenv'

const appEnv = process.env.APP_ENV
if (appEnv) {
  console.log(`Loading .env.${appEnv} files...`)
  config({ path: `.env.${appEnv}` })
  config({ path: `./apps/web/.env.${appEnv}` })
  config({ path: `./apps/server/.env.${appEnv}` })
}

config({ path: './.env' })
config({ path: './apps/web/.env' })
config({ path: './apps/server/.env' })

const app = await alchemy('budgie')

const db = await D1Database('database', {
  migrationsDir: 'packages/db/src/migrations',
  name: 'budgie-database',
})

const bucket = await R2Bucket('storage', {
  name: 'budgie-storage',
})

export const web = await TanStackStart('web', {
  bindings: {
    VITE_SERVER_URL: process.env.VITE_SERVER_URL || '',
  },
  compatibilityDate: '2025-11-18',
  cwd: 'apps/web',
  dev: {
    command: 'pnpm run dev',
  },
})

export const server = await Worker('server', {
  bindings: {
    BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || '',
    BUCKET: bucket,
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    DB: db,
    GOOGLE_GENERATIVE_AI_API_KEY: alchemy.secret(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    ),
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
    SHORT_VIDEO_TOKEN: alchemy.secret(process.env.SHORT_VIDEO_TOKEN),
  },
  compatibility: 'node',
  compatibilityDate: '2025-11-18',
  cwd: 'apps/server',
  dev: {
    port: 3000,
  },
  entrypoint: 'src/index.ts',
})

console.log(`Web    -> ${web.url}`)
console.log(`Server -> ${server.url}`)

await app.finalize()
