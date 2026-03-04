import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { mealRepo } from '@server/repositories/mealRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { mealSchema } from '@server/entities/meal.js'

export default authedHouseholdProcedure
  .use(provideRepos({ mealRepo, memberRepo }))
  .use(enforceIsMember)
  .input(mealSchema.pick({ id: true }).strict())
  .query(async ({ input: { id }, ctx }) => {
    const result = await ctx.repos.mealRepo
      .findById(id, ctx.authHousehold!.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
