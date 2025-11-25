import alchemy from 'alchemy'
import { D1Database, TanStackStart, Worker } from 'alchemy/cloudflare'
import { config } from 'dotenv'

config({ path: './.env' })
config({ path: './apps/web/.env' })
config({ path: './apps/server/.env' })

const app = await alchemy('budgie')

const db = await D1Database('database', {
	migrationsDir: 'packages/db/src/migrations',
})

export const web = await TanStackStart('web', {
	bindings: {
		VITE_SERVER_URL: process.env.VITE_SERVER_URL || '',
	},
	cwd: 'apps/web',
	dev: {
		command: 'pnpm run dev',
	},
})

export const server = await Worker('server', {
	bindings: {
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || '',
		CORS_ORIGIN: process.env.CORS_ORIGIN || '',
		DB: db,
		GOOGLE_GENERATIVE_AI_API_KEY: alchemy.secret(
			process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		),
	},
	compatibility: 'node',
	cwd: 'apps/server',
	dev: {
		port: 3000,
	},
	entrypoint: 'src/index.ts',
})

console.log(`Web    -> ${web.url}`)
console.log(`Server -> ${server.url}`)

await app.finalize()
