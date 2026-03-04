import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedProcedure
  .use(provideRepos({ memberRepo }))
  .query(async ({ ctx }) => {
    const result = await ctx.repos.memberRepo
      .findByUserId(ctx.authUser.id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
