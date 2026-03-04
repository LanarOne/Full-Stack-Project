import provideRepos from '@server/trpc/provideRepos/index.js'
import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import { householdRepo } from '@server/repositories/householdRepo.js'
import { householdSchema } from '@server/entities/household.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedProcedure
  .use(provideRepos({ householdRepo }))
  .input(householdSchema.pick({ id: true }))
  .query(async ({ input: householdId, ctx }) => {
    const { id } = householdId

    const result = await ctx.repos.householdRepo
      .findById(id)
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
