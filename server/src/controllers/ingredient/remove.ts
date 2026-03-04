import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { ingredientSchema } from '@server/entities/ingredient.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    ingredientSchema.pick({ id: true }).strict()
  )
  .mutation(async ({ input: { id }, ctx }) => {
    const result = await ctx.repos.ingredientRepo
      .delete(id, ctx.authHousehold!.id)
      .catch((err: unknown) =>
        handleKyselyErrors(err)
      )

    return result
  })
