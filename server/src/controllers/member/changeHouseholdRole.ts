import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { memberSchema } from '@server/entities/member.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { TRPCError } from '@trpc/server'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsChief } from '@server/trpc/middlewares/isChiefMiddleware.js'

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
  .mutation(async ({ input, ctx }) => {
    const { userId, roleId } = input
    if (ctx.authUser.id === userId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'You cannot modify your own role',
      })
    }

    const result = await ctx.repos.memberRepo
      .update({
        userId,
        roleId,
        householdId: ctx.authHousehold!.id,
      })
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
