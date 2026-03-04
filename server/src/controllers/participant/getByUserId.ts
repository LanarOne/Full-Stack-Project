import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { participantRepo } from '@server/repositories/participantRepo.js'
import { authedProcedure } from '@server/trpc/authedProcedure/index.js'

export default authedProcedure
  .use(
    provideRepos({
      memberRepo,
      participantRepo,
    })
  )
  .mutation(async ({ ctx }) => {
    const result = await ctx.repos.participantRepo
      .findByUserId(ctx.authUser.id)
      .catch((err) => handleKyselyErrors(err))

    return result
  })
