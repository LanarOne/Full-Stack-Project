import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { userRepo } from '@server/repositories/userRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedProcedure
  .use(provideRepos({ userRepo }))
  .query(async ({ ctx }) => {
    const { id } = ctx.authUser

    const result = await ctx.repos.userRepo
      .findById(id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
