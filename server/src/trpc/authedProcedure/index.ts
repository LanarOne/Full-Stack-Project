import config from '@server/config'
import { publicProcedure } from '@server/trpc'
import { TRPCError } from '@trpc/server'
import { getUserFromToken } from '@server/helpers/tokenHelpers'

export const authedProcedure =
  publicProcedure.use(({ ctx, next }) => {
    if (ctx.authUser) {
      return next({
        ctx: {
          authUser: ctx.authUser,
        },
      })
    }

    if (!ctx.req) {
      const message =
        config.env === 'development' ||
        config.env === 'test'
          ? 'Missing Express request object. If you are running tests, make sure to provide some req object in the procedure context'
          : 'Missing Express request object'

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message,
      })
    }

    const token = ctx.req
      .header('Authorization')
      ?.replace('Bearer ', '')

    if (!token) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Unauthenticated. Please log in',
      })
    }

    const authUser = getUserFromToken(token)

    if (!authUser) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid token.',
      })
    }

    return next({
      ctx: {
        authUser,
      },
    })
  })
