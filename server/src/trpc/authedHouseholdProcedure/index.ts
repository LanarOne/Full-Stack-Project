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
    .use(async ({ ctx, next, getRawInput }) => {
      if (ctx.authHousehold) {
        return next({
          ctx: {
            authHousehold: ctx.authHousehold,
          },
        })
      }

      const rawInput = await getRawInput()
      const input = rawInput as
        | { householdId?: number }
        | undefined
      const householdId = input?.householdId

      if (!householdId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'No household context available',
        })
      }

      const userIsInHousehold =
        await ctx.repos.memberRepo.findOne({
          userId: ctx.authUser.id,
          householdId,
        })

      if (!userIsInHousehold) {
        logger.warn(
          {
            userId: ctx.authUser.id,
            householdId,
          },
          'User not in household'
        )
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            "You're not part of this household",
        })
      }

      return next({
        ctx: {
          authHousehold: {
            id: householdId,
          },
        },
      })
    })
