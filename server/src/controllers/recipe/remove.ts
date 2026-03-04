import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { recipeRepo } from '@server/repositories/recipeRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { recipeSchema } from '@server/entities/recipe.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsChief } from '@server/trpc/middlewares/isChiefMiddleware.js'

export default authedHouseholdProcedure
  .use(provideRepos({ recipeRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .use(enforceIsChief)
  .input(recipeSchema.pick({ id: true }).strict())
  .query(async ({ input: { id }, ctx }) => {
    const result = await ctx.repos.recipeRepo
      .delete({
        id,
        householdId: ctx.authHousehold!.id,
      })
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
