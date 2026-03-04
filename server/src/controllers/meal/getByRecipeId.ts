import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { mealRepo } from '@server/repositories/mealRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { mealSchema } from '@server/entities/meal.js'
import { TRPCError } from '@trpc/server'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'

export default authedHouseholdProcedure
  .use(provideRepos({ mealRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    mealSchema.pick({ recipeId: true }).strict()
  )
  .query(async ({ input: { recipeId }, ctx }) => {
    if (!recipeId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You must provide a recipe ID',
      })
    }

    const result = await ctx.repos.mealRepo
      .findByRecipeId(
        recipeId,
        ctx.authHousehold!.id
      )
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
