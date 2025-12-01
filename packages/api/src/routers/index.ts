import type { RouterClient } from '@orpc/server'
import { protectedProcedure, publicProcedure } from '../index'
import { albumRouter } from './album'
import { albumImageRouter } from './albumImage'
import { modelRouter } from './model'
import { shortVideoRouter } from './short-video'
import { tagRouter } from './tag'
import { todoRouter } from './todo'
import { uploadRouter } from './upload'

export const appRouter = {
  album: albumRouter,
  albumImage: albumImageRouter,
  healthCheck: publicProcedure.handler(() => {
    return 'OK'
  }),
  model: modelRouter,
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: 'This is private',
      user: context.session?.user,
    }
  }),
  shortVideo: shortVideoRouter,
  tag: tagRouter,
  todo: todoRouter,
  upload: uploadRouter,
}
export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
