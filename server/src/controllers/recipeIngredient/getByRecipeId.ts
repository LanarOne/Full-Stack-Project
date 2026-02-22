import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { handleKyselyErrors } from '@server/utils/errors'
import { recipeIngredientSchema } from '@server/entities/recipeIngredient'

export default authedHouseholdProcedure
  .use(
    provideRepos({
      recipeIngredientRepo,
      memberRepo,
    })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    recipeIngredientSchema
      .pick({ recipeId: true })
      .strict()
  )
  .query(
    async ({
      input: { recipeId },
      ctx: { repos, authHousehold },
    }) => {
      const result =
        await repos.recipeIngredientRepo
          .findByRecipeId(
            recipeId,
            authHousehold!.id
          )
          .catch((error: unknown) =>
            handleKyselyErrors(error)
          )

      return result
    }
  )
