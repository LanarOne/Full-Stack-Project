import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { leftoverRepo } from '@server/repositories/leftoverRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { leftoverSchema } from '@server/entities/leftover.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'

export default authedHouseholdProcedure
  .use(provideRepos({ leftoverRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    leftoverSchema.pick({ mealId: true }).strict()
  )
  .query(async ({ input: { mealId }, ctx }) => {
    const result = await ctx.repos.leftoverRepo
      .findByMealId(mealId, ctx.authHousehold!.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
