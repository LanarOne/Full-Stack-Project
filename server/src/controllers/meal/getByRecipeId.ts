import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { mealRepo } from '@server/repositories/mealRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { mealSchema } from '@server/entities/meal'
import { TRPCError } from '@trpc/server'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ mealRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    mealSchema.pick({ recipeId: true }).strict()
  )
  .query(
    async ({
      input: { recipeId },
      ctx: { authHousehold, repos },
    }) => {
      if (!recipeId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You must provide a recipe ID',
        })
      }

      const result = await repos.mealRepo
        .findByRecipeId(
          recipeId,
          authHousehold!.id
        )
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
