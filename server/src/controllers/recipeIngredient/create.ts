import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { handleKyselyErrors } from '@server/utils/errors'
import { recipeIngredientSchema } from '@server/entities/recipeIngredient'

export default authedHouseholdProcedure
  .use(
    provideRepos({
      recipeIngredientRepo,
      memberRepo,
      ingredientRepo,
    })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    recipeIngredientSchema
      .pick({
        recipeId: true,
        ingredientId: true,
        amount: true,
      })
      .strict()
  )
  .mutation(
    async ({
      input: recipeIngredient,
      ctx: { repos, authHousehold },
    }) => {
      const ingredient =
        await repos.ingredientRepo
          .findById(
            recipeIngredient.ingredientId,
            authHousehold!.id
          )
          .catch((err) => handleKyselyErrors(err))

      const result =
        await repos.recipeIngredientRepo
          .create({
            ...recipeIngredient,
            unit: ingredient.unit,
            householdId: authHousehold!.id,
          })
          .catch((err) => handleKyselyErrors(err))

      return result
    }
  )
