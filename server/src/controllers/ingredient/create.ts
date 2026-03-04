import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { ingredientSchema } from '@server/entities/ingredient.js'
import { ingredientRepo } from '@server/repositories/ingredientRepo.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'

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
    async ({ input: ingredient, ctx }) => {
      const result =
        await ctx.repos.ingredientRepo
          .create({
            ...ingredient,
            householdId: ctx.authHousehold!.id,
          })
          .catch((error: unknown) =>
            handleKyselyErrors(error)
          )

      return result
    }
  )
