import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedProcedure
  .use(provideRepos({ recipeRepo }))
  .query(async ({ ctx }) => {
    const result = await ctx.repos.recipeRepo
      .findAllPublicRecipe()
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
