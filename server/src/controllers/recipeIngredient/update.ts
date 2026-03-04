import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { recipeIngredientSchema } from '@server/entities/recipeIngredient.js'

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
      .pick({
        recipeId: true,
        ingredientId: true,
        amount: true,
        unit: true,
      })
      .partial({ amount: true, unit: true })
      .strict()
  )
  .mutation(
    async ({
      input: {
        recipeId,
        ingredientId,
        amount,
        unit,
      },
      ctx,
    }) => {
      const result =
        await ctx.repos.recipeIngredientRepo
          .update({
            householdId: ctx.authHousehold!.id,
            ingredientId,
            amount,
            unit,
            recipeId,
          })
          .catch((err: unknown) =>
            handleKyselyErrors(err)
          )
      return result
    }
  )
