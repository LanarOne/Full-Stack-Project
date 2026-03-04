import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware.js'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { participantRepo } from '@server/repositories/participantRepo.js'
import { participantSchema } from '@server/entities/participant.js'

export default authedHouseholdProcedure
  .use(
    provideRepos({
      memberRepo,
      participantRepo,
    })
  )
  .use(enforceIsMember)
  .use(enforceIsGuest)
  .input(
    participantSchema
      .pick({
        mealId: true,
        userId: true,
        confirmation: true,
        attended: true,
      })
      .partial({
        confirmation: true,
        attended: true,
      })
      .strict()
  )
  .mutation(
    async ({ input: participant, ctx }) => {
      const result =
        await ctx.repos.participantRepo
          .create({
            ...participant,
          })
          .catch((err: unknown) =>
            handleKyselyErrors(err)
          )

      return result
    }
  )
