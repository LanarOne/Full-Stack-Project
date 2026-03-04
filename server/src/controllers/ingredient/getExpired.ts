import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .query(async ({ ctx }) => {
    const today = new Date()

    const result = await ctx.repos.ingredientRepo
      .findByPassedExpiryDate(
        today,
        ctx.authHousehold!.id
      )
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
