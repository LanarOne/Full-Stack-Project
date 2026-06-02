import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import { TRPCError } from '@trpc/server'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import logger from '@server/logger.js'
import { z } from 'zod'

export const householdInputSchema = z.object({
  householdId: z.number().int().positive(),
})
export const authedHouseholdProcedure =
  authedProcedure
    .use(provideRepos({ memberRepo }))
    .input(householdInputSchema)
    .use(async ({ ctx, input, next }) => {
      if (
        ctx.authHousehold &&
        ctx.authHousehold.id === input.householdId
      ) {
        return next({
          ctx: {
            authHousehold: ctx.authHousehold,
          },
        })
      }

      const userIsInHousehold =
        await ctx.repos.memberRepo.findOne({
          userId: ctx.authUser.id,
          householdId: input.householdId,
        })

      if (!userIsInHousehold) {
        logger.warn(
          {
            userId: ctx.authUser.id,
            householdId: input.householdId,
          },
          'User not in household'
        )
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            'User is not a member of this Household',
        })
      }

      return next({
        ctx: {
          authHousehold: {
            id: input.householdId,
          },
        },
      })
    })
