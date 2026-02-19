import { authedProcedure } from '@server/trpc/authedProcedure'
import provideRepos from '@server/trpc/provideRepos'
import { memberRepo } from '@server/repositories/memberRepo'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedProcedure
  .use(provideRepos({ memberRepo }))
  .query(async ({ ctx: { repos, authUser } }) => {
    return await repos.memberRepo
      .findByUserId(authUser.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )
  })
