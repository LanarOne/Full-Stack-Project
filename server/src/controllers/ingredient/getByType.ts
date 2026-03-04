import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { ingredientSchema } from '@server/entities/ingredient.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .input(
    ingredientSchema.pick({ type: true }).strict()
  )
  .query(async ({ input: { type }, ctx }) => {
    const result = await ctx.repos.ingredientRepo
      .findByType(type, ctx.authHousehold!.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
