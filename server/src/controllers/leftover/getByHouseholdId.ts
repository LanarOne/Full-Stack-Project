import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { leftoverRepo } from '@server/repositories/leftoverRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ leftoverRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .query(
    async ({ ctx: { authHousehold, repos } }) => {
      const result = await repos.leftoverRepo
        .findByHouseholdId(authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
