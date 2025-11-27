import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as authSchema from './schema/auth'
import * as shortVideoSchema from './schema/short-video'
import * as todoSchema from './schema/todo'

export const db = drizzle(env.DB, {
  schema: {
    ...authSchema,
    ...shortVideoSchema,
    ...todoSchema,
  },
})
