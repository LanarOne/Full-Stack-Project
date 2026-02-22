import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import provideRepos from '@server/trpc/provideRepos'
import { ingredientSchema } from '@server/entities/ingredient'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .input(
    ingredientSchema.pick({ type: true }).strict()
  )
  .query(
    async ({
      input: { type },
      ctx: { authHousehold, repos },
    }) => {
      const result = await repos.ingredientRepo
        .findByType(type, authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
