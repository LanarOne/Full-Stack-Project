import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { mealRepo } from '@server/repositories/mealRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { mealSchema } from '@server/entities/meal'

export default authedHouseholdProcedure
  .use(provideRepos({ mealRepo, memberRepo }))
  .use(enforceIsMember)
  .input(mealSchema.pick({ id: true }).strict())
  .query(
    async ({
      input: { id },
      ctx: { authHousehold, repos },
    }) => {
      return await repos.mealRepo
        .findById(id, authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )
    }
  )
