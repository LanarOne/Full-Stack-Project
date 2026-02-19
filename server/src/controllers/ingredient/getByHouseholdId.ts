import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import provideRepos from '@server/trpc/provideRepos'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .query(
    async ({ ctx: { authHousehold, repos } }) => {
      return await repos.ingredientRepo
        .findByHouseholdId(authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )
    }
  )
