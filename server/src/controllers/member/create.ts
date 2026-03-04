import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { memberSchema } from '@server/entities/member.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { TRPCError } from '@trpc/server'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'

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
    async ({ input: { userId }, ctx }) => {
      if (ctx.authUser.id === userId)
        throw new TRPCError({
          message:
            'You cannot add yourself to your own household',
          code: 'BAD_REQUEST',
        })

      const alreadyExist =
        await ctx.repos.memberRepo
          .findOne({
            userId,
            householdId: ctx.authHousehold!.id,
          })
          .catch(() => null)

      if (alreadyExist) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'The user already exists in this household',
        })
      }

      const result = await ctx.repos.memberRepo
        .create({
          householdId: ctx.authHousehold?.id,
          userId,
          roleId: 3,
        })
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
