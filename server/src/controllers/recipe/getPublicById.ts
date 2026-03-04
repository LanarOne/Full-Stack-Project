import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { recipeSchema } from '@server/entities/recipe.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { TRPCError } from '@trpc/server'

export default authedProcedure
  .use(provideRepos({ recipeRepo }))
  .input(
    recipeSchema
      .pick({ id: true, householdId: true })
      .strict()
  )
  .query(
    async ({
      input: { id, householdId },
      ctx,
    }) => {
      const recipe = await ctx.repos.recipeRepo
        .findById({
          id,
          householdId,
        })
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      if (!recipe.public) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'This recipe is not public',
        })
      }

      return recipe
    }
  )
