import { authedProcedure } from '@server/trpc/authedProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { recipeSchema } from '@server/entities/recipe'

export default authedProcedure
  .use(provideRepos({ recipeRepo }))
  .input(
    recipeSchema
      .pick({ householdId: true })
      .strict()
  )
  .query(
    async ({
      input: { householdId },
      ctx: { repos },
    }) => {
      const result = await repos.recipeRepo
        .findAllPublicRecipeByHousehold(
          householdId
        )
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
