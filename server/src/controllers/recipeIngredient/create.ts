import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { recipeIngredientSchema } from '@server/entities/recipeIngredient.js'

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
    async ({ input: recipeIngredient, ctx }) => {
      const ingredient =
        await ctx.repos.ingredientRepo
          .findById(
            recipeIngredient.ingredientId,
            ctx.authHousehold!.id
          )
          .catch((err) => handleKyselyErrors(err))

      const result =
        await ctx.repos.recipeIngredientRepo
          .create({
            ...recipeIngredient,
            unit: ingredient.unit,
            householdId: ctx.authHousehold!.id,
          })
          .catch((err: unknown) =>
            handleKyselyErrors(err)
          )

      return result
    }
  )
