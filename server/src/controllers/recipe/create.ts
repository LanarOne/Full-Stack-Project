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
  .input(
    recipeSchema
      .pick({
        name: true,
        description: true,
        portions: true,
        prepTime: true,
        public: true,
        tips: true,
        img: true,
        vid: true,
      })
      .partial({
        tips: true,
        img: true,
        vid: true,
      })
      .strict()
  )
  .mutation(
    async ({
      input: recipe,
      ctx: { repos, authHousehold },
    }) => {
      return await repos.recipeRepo
        .create({
          ...recipe,
          householdId: authHousehold.id,
        })
        .catch((err) => handleKyselyErrors(err))
    }
  )
