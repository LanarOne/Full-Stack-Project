import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { recipeSchema } from '@server/entities/recipe.js'

export default authedProcedure
  .use(provideRepos({ recipeRepo }))
  .input(
    recipeSchema
      .pick({ householdId: true })
      .strict()
  )
  .query(
    async ({ input: { householdId }, ctx }) => {
      const result = await ctx.repos.recipeRepo
        .findAllPublicRecipeByHousehold(
          householdId
        )
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
