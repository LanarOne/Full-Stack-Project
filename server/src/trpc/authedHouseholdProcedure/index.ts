import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import config from '@server/config.js'
import { TRPCError } from '@trpc/server'
import { getHouseholdFromToken } from '@server/helpers/tokenHelpers.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import logger from "@server/logger.js";

export const authedHouseholdProcedure =
  authedProcedure
    .use(provideRepos({ memberRepo }))
    .use(async ({ ctx, next }) => {
      if (ctx.authHousehold) {
        return next({
          ctx: {
            authedHousehold: ctx.authHousehold,
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

      const token = ctx
        .req!.header('Authorization')
        ?.replace('Bearer ', '')

      if (!token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            'Unauthenticated, please log in',
        })
      }

      const authedHousehold =
        getHouseholdFromToken(token)

      if (!authedHousehold) {
          logger.warn({url:ctx.req?.url }, 'Invalid token')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        })
      }

      const userIsInHousehold =
        await ctx.repos.memberRepo.findOne({
          userId: ctx.authUser.id,
          householdId: authedHousehold.id,
        })

      if (!userIsInHousehold) {
          logger.warn({userId: ctx.authUser.id, householdId: authedHousehold.id}, 'User not in Household')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        })
      }
      return next({
        ctx: {
          authHousehold: authedHousehold,
        },
      })
    })
