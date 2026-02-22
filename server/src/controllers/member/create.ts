import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { memberSchema } from '@server/entities/member'
import { handleKyselyErrors } from '@server/utils/errors'
import { TRPCError } from '@trpc/server'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    memberSchema
      .pick({
        userId: true,
      })
      .strict()
  )
  .mutation(
    async ({
      input: { userId },
      ctx: { authUser, authHousehold, repos },
    }) => {
      if (authUser.id === userId)
        throw new TRPCError({
          message:
            'You cannot add yourself to your own household',
          code: 'BAD_REQUEST',
        })

      const alreadyExist = await repos.memberRepo
        .findOne({
          userId,
          householdId: authHousehold!.id,
        })
        .catch(() => null)

      if (alreadyExist) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'The user already exists in this household',
        })
      }

      const result = await repos.memberRepo
        .create({
          householdId: authHousehold?.id,
          userId,
          roleId: 3,
        })
        .catch((error) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
