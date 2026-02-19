import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { ingredientSchema } from '@server/entities/ingredient'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    ingredientSchema.pick({ id: true }).strict()
  )
  .mutation(
    async ({
      input: { id },
      ctx: { repos, authHousehold },
    }) => {
      return await repos.ingredientRepo
        .delete(id, authHousehold!.id)
        .catch((err: unknown) =>
          handleKyselyErrors(err)
        )
    }
  )
