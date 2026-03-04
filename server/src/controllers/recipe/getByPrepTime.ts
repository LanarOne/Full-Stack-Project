import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import {
  type RecipePublic,
  recipeSchema,
} from '@server/entities/recipe.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedHouseholdProcedure
  .use(provideRepos({ recipeRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    recipeSchema.pick({ prepTime: true }).strict()
  )
  .query(
    async ({
      input: { prepTime },
      ctx,
    }): Promise<RecipePublic[]> => {
      const result = await ctx.repos.recipeRepo
        .findByPrepTime(
          prepTime,
          ctx.authHousehold!.id
        )
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
