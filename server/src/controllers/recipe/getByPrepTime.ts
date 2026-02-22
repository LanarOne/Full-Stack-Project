import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import {
  type RecipePublic,
  recipeSchema,
} from '@server/entities/recipe'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(provideRepos({ recipeRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    recipeSchema.pick({ prepTime: true }).strict()
  )
  .query(
    async ({
      input: { prepTime },
      ctx: { repos, authHousehold },
    }): Promise<RecipePublic[]> => {
      const result = await repos.recipeRepo
        .findByPrepTime(
          prepTime,
          authHousehold!.id
        )
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
