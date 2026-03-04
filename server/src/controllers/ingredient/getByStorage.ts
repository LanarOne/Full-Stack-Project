import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { ingredientSchema } from '@server/entities/ingredient.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    ingredientSchema
      .pick({ storage: true })
      .strict()
  )
  .query(async ({ input: storage, ctx }) => {
    const result = await ctx.repos.ingredientRepo
      .findByStorage(
        ctx.authHousehold!.id,
        storage
      )
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
