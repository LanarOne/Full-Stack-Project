import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { memberSchema } from '@server/entities/member'
import { handleKyselyErrors } from '@server/utils/errors'
import { TRPCError } from '@trpc/server'
import { isMember } from '@server/helpers/isMember'
import { isAdmin } from '@server/helpers/isAdmin'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsChief } from '@server/trpc/middlewares/isChiefMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsChief)
  .input(
    memberSchema
      .pick({
        userId: true,
        roleId: true,
      })
      .strict()
  )
  .mutation(
    async ({
      input,
      ctx: { repos, authUser, authHousehold },
    }) => {
      const { userId, roleId } = input
      if (authUser.id === userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'You cannot modify your own role',
        })
      }

      return await repos.memberRepo
        .update({
          userId: userId,
          roleId: roleId,
          householdId: authHousehold!.id,
        })
        .catch((error) =>
          handleKyselyErrors(error)
        )
    }
  )
