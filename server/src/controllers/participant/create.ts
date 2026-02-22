import { authedHouseholdProcedure } from '@server/trpc/authedHouseholdProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { enforceIsMember } from '@server/trpc/middlewares/isMemberMiddleware'
import { enforceIsGuest } from '@server/trpc/middlewares/isGuestMiddleware'
import { handleKyselyErrors } from '@server/utils/errors'
import { participantRepo } from '@server/repositories/participantRepo'
import { participantSchema } from '@server/entities/participant'

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
    async ({
      input: participant,
      ctx: { repos },
    }) => {
      const result = await repos.participantRepo
        .create({
          ...participant,
        })
        .catch((err) => handleKyselyErrors(err))

      return result
    }
  )
