import { publicProcedure } from '@server/trpc/index.js'
import { TRPCError } from '@trpc/server'
import config from '@server/config.js'
import logger from '@server/logger.js'

export default publicProcedure.mutation(
  ({ ctx }) => {
    if (!ctx.req) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Missing Express response object',
      })
    }

    ctx.res?.clearCookie(config.auth.cookieName, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      path: '/',
    })

    logger.info('User logged out')

    return { success: true }
  }
)
