import provideRepos from '@server/trpc/provideRepos'
import { authedProcedure } from '@server/trpc/authedProcedure'
import { householdRepo } from '@server/repositories/householdRepo'
import { householdSchema } from '@server/entities/household'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedProcedure
  .use(provideRepos({ householdRepo }))
  .input(householdSchema.pick({ id: true }))
  .query(
    async ({
      input: householdId,
      ctx: { repos },
    }) => {
      const { id } = householdId

      const result = await repos.householdRepo
        .findById(id)
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
