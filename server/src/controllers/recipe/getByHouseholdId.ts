import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(provideRepos({ recipeRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .query(
    async ({ ctx: { repos, authHousehold } }) => {
      const result = await repos.recipeRepo
        .findByHouseholdId(authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
