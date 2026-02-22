import { memberSchema } from '@server/entities/member'
import { handleKyselyErrors } from '@server/utils/errors'
import { memberRepo } from '@server/repositories/memberRepo'
import { authedProcedure } from '@server/trpc/authedProcedure'
import provideRepos from '@server/trpc/provideRepos'

export default authedProcedure
  .use(provideRepos({ memberRepo }))
  .input(
    memberSchema
      .pick({
        householdId: true,
      })
      .strict()
  )
  .query(
    async ({
      input: { householdId },
      ctx: { authUser, repos },
    }) => {
      const result = await repos.memberRepo
        .findOne({
          householdId,
          userId: authUser.id,
        })
        .catch((error) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
