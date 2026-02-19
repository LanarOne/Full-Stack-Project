import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { handleKyselyErrors } from '@server/utils/errors'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { mealSchema } from '@server/entities/meal'
import { mealRepo } from '@server/repositories/mealRepo'

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
  .mutation(
    async ({
      input: meal,
      ctx: { repos, authHousehold },
    }) => {
      return await repos.mealRepo
        .create({
          ...meal,
          householdId: authHousehold!.id,
        })
        .catch((err) => handleKyselyErrors(err))
    }
  )
