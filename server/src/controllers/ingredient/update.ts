import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { ingredientRepo } from '@server/repositories/ingredientRepo'
import { memberRepo } from '@server/repositories/memberRepo'
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
      .pick({
        id: true,
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
      .strict()
  )
  .mutation(
    async ({
      input: ingredient,
      ctx: { repos, authHousehold },
    }) => {
      return await repos.ingredientRepo
        .update(
          { ...ingredient },
          authHousehold!.id
        )
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )
    }
  )
