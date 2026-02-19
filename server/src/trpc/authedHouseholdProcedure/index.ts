import { authedProcedure } from '@server/trpc/authedProcedure'
import config from '@server/config'
import { TRPCError } from '@trpc/server'
import { getHouseholdFromToken } from '@server/helpers/tokenHelpers'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'

export const authedHouseholdProcedure =
  authedProcedure
    .use(provideRepos({ memberRepo }))
    .use(
      async ({
        ctx: {
          authUser,
          authHousehold,
          req,
          repos,
        },
        next,
      }) => {
        if (authHousehold) {
          return next({
            ctx: {
              authedHousehold: authHousehold,
            },
          })
        }

        if (!req) {
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

        const token = req
          .header('Authorization')
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
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          })
        }

        const userIsInHousehold =
          await repos.memberRepo.findOne({
            userId: authUser.id,
            householdId: authedHousehold.id,
          })

        if (!userIsInHousehold) {
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
      }
    )
