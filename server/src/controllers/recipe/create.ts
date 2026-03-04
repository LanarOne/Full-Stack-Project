import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { recipeSchema } from '@server/entities/recipe.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

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
  .mutation(async ({ input: recipe, ctx }) => {
    const result = await ctx.repos.recipeRepo
      .create({
        ...recipe,
        householdId: ctx.authHousehold!.id,
      })
      .catch((err: unknown) =>
        handleKyselyErrors(err)
      )

    return result
  })
