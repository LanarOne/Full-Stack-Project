import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { participantRepo } from '@server/repositories/participantRepo.js'
import { participantSchema } from '@server/entities/participant.js'
import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import { enforceWasInvited } from '@server/trpc/middlewares/wasInvitedMiddleware.js'

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
      })
      .strict()
  )
  .use(enforceWasInvited)
  .mutation(
    async ({ input: { mealId }, ctx }) => {
      const result =
        await ctx.repos.participantRepo
          .findUnconfirmed(mealId)
          .catch((err: unknown) =>
            handleKyselyErrors(err)
          )

      return result
    }
  )
