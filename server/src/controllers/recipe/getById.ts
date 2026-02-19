import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { recipeSchema } from '@server/entities/recipe'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(provideRepos({ recipeRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(recipeSchema.pick({ id: true }).strict())
  .query(
    async ({
      input: { id },
      ctx: { repos, authHousehold },
    }) => {
      return await repos.recipeRepo
        .findById({
          id: id,
          householdId: authHousehold!.id,
        })
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )
    }
  )
