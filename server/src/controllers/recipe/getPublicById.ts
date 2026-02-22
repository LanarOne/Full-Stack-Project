import { authedProcedure } from '@server/trpc/authedProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { recipeSchema } from '@server/entities/recipe'
import { handleKyselyErrors } from '@server/utils/errors'
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
      ctx: { repos },
    }) => {
      const recipe = await repos.recipeRepo
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
