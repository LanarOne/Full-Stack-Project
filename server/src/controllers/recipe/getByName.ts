import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { recipeRepo } from '@server/repositories/recipeRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { recipeSchema } from '@server/entities/recipe'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(provideRepos({ recipeRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    recipeSchema.pick({ name: true }).strict()
  )
  .query(
    async ({
      input: { name },
      ctx: { repos, authHousehold },
    }) => {
      return await repos.recipeRepo
        .findByName(name, authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )
    }
  )
