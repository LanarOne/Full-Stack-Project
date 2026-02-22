import { authedProcedure } from '@server/trpc/authedProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedProcedure
  .use(provideRepos({ recipeRepo }))
  .query(async ({ ctx: { repos } }) => {
    const result = await repos.recipeRepo
      .findAllPublicRecipe()
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
