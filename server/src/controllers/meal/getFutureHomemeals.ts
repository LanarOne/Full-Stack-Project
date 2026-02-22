import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { mealRepo } from '@server/repositories/mealRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ mealRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .query(
    async ({ ctx: { authHousehold, repos } }) => {
      const result = await repos.mealRepo
        .findFutureHomeMeals(authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
