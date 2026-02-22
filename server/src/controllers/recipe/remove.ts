import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { recipeSchema } from '@server/entities/recipe'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsChief } from '@server/trpc/middlewares/isChiefMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ recipeRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .use(enforceIsChief)
  .input(recipeSchema.pick({ id: true }).strict())
  .query(
    async ({
      input: { id },
      ctx: { repos, authHousehold },
    }) => {
      const result = await repos.recipeRepo
        .delete({
          id,
          householdId: authHousehold!.id,
        })
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
