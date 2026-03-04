import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { leftoverRepo } from '@server/repositories/leftoverRepo.js'
import { leftoverSchema } from '@server/entities/leftover.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({
      memberRepo,
      leftoverRepo,
    })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    leftoverSchema
      .pick({
        id: true,
        portions: true,
      })
      .strict()
  )
  .mutation(async ({ input: leftover, ctx }) => {
    const result = await ctx.repos.leftoverRepo
      .update({
        ...leftover,
        householdId: ctx.authHousehold!.id,
      })
      .catch((err) => handleKyselyErrors(err))

    return result
  })
