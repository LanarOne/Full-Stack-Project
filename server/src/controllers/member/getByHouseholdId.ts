import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ memberRepo }))
  .use(enforceIsMember)
  .query(
    async ({
      ctx: { repos, authedHousehold },
    }) => {
      const result = await repos.memberRepo
        .findByHouseholdId(authedHousehold.id)
        .catch((error) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
