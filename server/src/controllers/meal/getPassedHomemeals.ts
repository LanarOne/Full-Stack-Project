import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { mealRepo } from '@server/repositories/mealRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'

export default authedHouseholdProcedure
  .use(provideRepos({ mealRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .query(async ({ ctx }) => {
    const result = await ctx.repos.mealRepo
      .findPassedHomeMeals(ctx.authHousehold!.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
