import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { ingredientSchema } from '@server/entities/ingredient'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
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
    ingredientSchema
      .pick({
        name: true,
        type: true,
        quantity: true,
        unit: true,
        purchaseDate: true,
        expiryDate: true,
        storage: true,
        notifInterval: true,
        nextNotif: true,
        isReady: true,
        note: true,
      })
      .partial({
        notifInterval: true,
        nextNotif: true,
        isReady: true,
        note: true,
      })
      .strict()
  )
  .mutation(
    async ({
      input: ingredient,
      ctx: { authHousehold, repos },
    }) => {
      return await repos.ingredientRepo
        .create({
          ...ingredient,
          householdId: authHousehold!.id,
        })
        .catch((error) =>
          handleKyselyErrors(error)
        )
    }
  )
