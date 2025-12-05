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
  adopt: true,
  migrationsDir: 'packages/db/src/migrations',
  name: 'budgie-database',
})

const bucket = await R2Bucket('storage', {
  adopt: true,
  dev: {
    remote: true,
  },
  name: 'budgie-storage',
})

export const web = await TanStackStart('web', {
  adopt: true,
  bindings: {
    BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || '',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '',
    DB: db,
    VITE_SERVER_URL: process.env.VITE_SERVER_URL || '',
  },
  compatibilityDate: '2025-11-18',
  cwd: 'apps/web',
  dev: {
    command: 'bun run dev',
  },
  domains: ['budgie.langliu.top'],
})

export const server = await Worker('server', {
  adopt: true,
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
  domains: ['budgie-server.langliu.top'],
  entrypoint: 'src/index.ts',
})

console.log(`Web    -> ${web.url}`)
console.log(`Server -> ${server.url}`)

await app.finalize()
