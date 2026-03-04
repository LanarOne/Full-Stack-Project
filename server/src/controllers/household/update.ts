import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import { householdRepo } from '@server/repositories/householdRepo.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { householdSchema } from '@server/entities/household.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsChief } from '@server/trpc/middlewares/isChiefMiddleware.js'

export default authedHouseholdProcedure
  .use(provideRepos({ householdRepo }))
  .use(enforceIsMember)
  .use(enforceIsChief)
  .input(
    householdSchema
      .pick({
        name: true,
        profilePicture: true,
      })
      .partial({
        name: true,
        profilePicture: true,
      })
      .strict()
  )
  .mutation(async ({ input, ctx }) => {
    const { name, profilePicture } = input

    const result = await ctx.repos.householdRepo
      .update(ctx.authHousehold!.id, {
        name,
        profilePicture,
      })
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
