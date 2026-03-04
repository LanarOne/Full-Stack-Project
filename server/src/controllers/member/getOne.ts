import { memberSchema } from '@server/entities/member.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { memberRepo } from '@server/repositories/memberRepo.js'
import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'

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
    async ({ input: { householdId }, ctx }) => {
      const result = await ctx.repos.memberRepo
        .findOne({
          householdId,
          userId: ctx.authUser.id,
        })
        .catch((error) =>
          handleKyselyErrors(error)
        )

      return result
    }
  )
