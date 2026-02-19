import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { handleKyselyErrors } from '@server/utils/errors'
import { leftoverRepo } from '@server/repositories/leftoverRepo'
import { leftoverSchema } from '@server/entities/leftover'

export default authedHouseholdProcedure
  .use(
    provideRepos({
      memberRepo,
      leftoverRepo,
    })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    leftoverSchema
      .pick({
        mealId: true,
        portions: true,
        expiryDate: true,
      })
      .strict()
  )
  .mutation(
    async ({
      input: leftover,
      ctx: { repos, authHousehold },
    }) => {
      return await repos.leftoverRepo
        .create({
          ...leftover,
          householdId: authHousehold!.id,
        })
        .catch((err) => handleKyselyErrors(err))
    }
  )
