import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .query(async ({ ctx }) => {
    const result = await ctx.repos.ingredientRepo
      .findByHouseholdId(ctx.authHousehold!.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
