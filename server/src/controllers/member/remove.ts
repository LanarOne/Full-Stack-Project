import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { memberSchema } from '@server/entities/member'
import { TRPCError } from '@trpc/server'
import { isAdmin } from '@server/helpers/isAdmin'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ memberRepo }))
  .use(enforceIsMember)
  .input(
    memberSchema.pick({ userId: true }).strict()
  )
  .mutation(
    async ({
      input: { userId },
      ctx: { repos, authUser, authHousehold },
    }) => {
      if (!authUser || !authHousehold) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            'Please log in or enter the appropriate Household space',
        })
      }

      const isChief = await isAdmin({
        userId: authUser.id,
        householdId: authHousehold.id,
        memberRepo: repos.memberRepo,
      })

      if (userId !== authUser.id && !isChief) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Only the chief or the user himself can do this',
        })
      }

      const result = await repos.memberRepo
        .delete(userId, authHousehold.id)
        .catch((error) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
