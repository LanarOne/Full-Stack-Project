import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { memberSchema } from '@server/entities/member.js'
import { TRPCError } from '@trpc/server'
import { isAdmin } from '@server/helpers/isAdmin.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'

export default authedHouseholdProcedure
  .use(provideRepos({ memberRepo }))
  .use(enforceIsMember)
  .input(
    memberSchema.pick({ userId: true }).strict()
  )
  .mutation(
    async ({ input: { userId }, ctx }) => {
      if (!ctx.authUser || !ctx.authHousehold) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            'Please log in or enter the appropriate Household space',
        })
      }

      const isChief = await isAdmin({
        userId: ctx.authUser.id,
        householdId: ctx.authHousehold.id,
        memberRepo: ctx.repos.memberRepo,
      })

      if (
        userId !== ctx.authUser.id &&
        !isChief
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Only the chief or the user himself can do this',
        })
      }

      const result = await ctx.repos.memberRepo
        .delete(userId, ctx.authHousehold.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
