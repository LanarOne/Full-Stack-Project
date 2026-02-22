import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { ingredientSchema } from '@server/entities/ingredient'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    ingredientSchema
      .pick({ storage: true })
      .strict()
  )
  .query(
    async ({
      input: { storage },
      ctx: { authHousehold, repos },
    }) => {
      const result = await repos.ingredientRepo
        .findByStorage(authHousehold!.id, storage)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
