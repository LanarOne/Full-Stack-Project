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
      })
      .strict()
  )
  .use(enforceWasInvited)
  .mutation(
    async ({
      input: { mealId, userId },
      ctx: { repos },
    }) => {
      const result = await repos.participantRepo
        .findOne(userId, mealId)
        .catch((err) => handleKyselyErrors(err))

      return result
    }
  )
