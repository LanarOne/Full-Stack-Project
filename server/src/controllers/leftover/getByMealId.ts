import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { leftoverRepo } from '@server/repositories/leftoverRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { leftoverSchema } from '@server/entities/leftover'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'

export default authedHouseholdProcedure
  .use(provideRepos({ leftoverRepo, memberRepo }))
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    leftoverSchema.pick({ mealId: true }).strict()
  )
  .query(
    async ({
      input: { mealId },
      ctx: { authHousehold, repos },
    }) => {
      const result = await repos.leftoverRepo
        .findByMealId(mealId, authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
