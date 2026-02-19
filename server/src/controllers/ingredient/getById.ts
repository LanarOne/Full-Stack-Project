import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
import { ingredientSchema } from '@server/entities/ingredient'
import { handleKyselyErrors } from '@server/utils/errors'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'

export default authedHouseholdProcedure
  .use(
    provideRepos({ ingredientRepo, memberRepo })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    ingredientSchema.pick({ id: true }).strict()
  )
  .query(
    async ({
      input: { id },
      ctx: { authHousehold, repos },
    }) => {
      return await repos.ingredientRepo
        .findById(id, authHousehold!.id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )
    }
  )
