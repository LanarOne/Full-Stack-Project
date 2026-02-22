import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import { householdRepo } from '@server/repositories/householdRepo'
import provideRepos from '@server/trpc/provideRepos'
import { householdSchema } from '@server/entities/household'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsChief } from '@server/trpc/middlewares/isChiefMiddleware'

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
  .mutation(
    async ({
      input,
      ctx: { authHousehold, repos },
    }) => {
      const { name, profilePicture } = input

      const result = await repos.householdRepo
        .update(authHousehold!.id, {
          name,
          profilePicture,
        })
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
