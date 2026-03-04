import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { mealSchema } from '@server/entities/meal.js'
import { mealRepo } from '@server/repositories/mealRepo.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({
      recipeRepo,
      memberRepo,
      mealRepo,
    })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    mealSchema
      .pick({
        recipeId: true,
        portions: true,
        outsideMeal: true,
        eatingDate: true,
      })
      .partial({
        recipeId: true,
        outsideMeal: true,
      })
      .strict()
  )
  .mutation(async ({ input: meal, ctx }) => {
    const result = await ctx.repos.mealRepo
      .create({
        ...meal,
        householdId: ctx.authHousehold!.id,
      })
      .catch((err) => handleKyselyErrors(err))

    return result
  })
