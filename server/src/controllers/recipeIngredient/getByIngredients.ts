import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeIngredientRepo } from '@server/repositories/recipeIngredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { recipeIngredientSchema } from '@server/entities/recipeIngredient.js'
import { z } from 'zod'

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
    z.array(
      recipeIngredientSchema
        .pick({ ingredientId: true })
        .strict()
    )
  )
  .query(async ({ input, ctx }) => {
    const ingredientIds = input.map(
      (i) => i.ingredientId
    )
    const result =
      await ctx.repos.recipeIngredientRepo
        .findByMultipleIngredientIds(
          ingredientIds,
          ctx.authHousehold!.id
        )
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

    return result
  })
