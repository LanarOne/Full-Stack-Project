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
    recipeSchema.pick({ name: true }).strict()
  )
  .query(async ({ input: { name }, ctx }) => {
    const result = await ctx.repos.recipeRepo
      .findByName(name, ctx.authHousehold!.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
