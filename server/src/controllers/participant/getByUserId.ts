import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'
import { participantRepo } from '@server/repositories/participantRepo'
import { authedProcedure } from '@server/trpc/authedProcedure'

export default authedProcedure
  .use(
    provideRepos({
      memberRepo,
      participantRepo,
    })
  )
  .mutation(
    async ({ ctx: { repos, authUser } }) => {
      return await repos.participantRepo
        .findByUserId(authUser.id)
        .catch((err) => handleKyselyErrors(err))
    }
  )
