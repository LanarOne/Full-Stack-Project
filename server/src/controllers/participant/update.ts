import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { participantRepo } from '@server/repositories/participantRepo'
import { participantSchema } from '@server/entities/participant'
import { authedProcedure } from '@server/trpc/authedProcedure'
import { enforceWasInvited } from '@server/trpc/middlewares/wasInvitedMiddleware'

export default authedProcedure
  .use(
    provideRepos({
      memberRepo,
      participantRepo,
    })
  )
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
  .use(enforceWasInvited)
  .mutation(
    async ({
      input: participant,
      ctx: { repos },
    }) => {
      return await repos.participantRepo
        .update(participant)
        .catch((err) => handleKyselyErrors(err))
    }
  )
