import provideRepos from '@server/trpc/provideRepos/index.js'
import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import { householdRepo } from '@server/repositories/householdRepo.js'
import { householdSchema } from '@server/entities/household.js'
import { handleKyselyErrors } from '@server/utils/errors.js'
import { memberRepo } from '@server/repositories/memberRepo.js'

export default authedProcedure
  .use(
    provideRepos({ householdRepo, memberRepo })
  )
  .input(
    householdSchema
      .pick({
        name: true,
        profilePicture: true,
      })
      .partial({ profilePicture: true })
  )
  .mutation(async ({ input, ctx }) => {
    const { name, profilePicture } = input

    // TRANSACTION HERE

    const newHousehold =
      await ctx.repos.householdRepo
        .create({
          name,
          profilePicture,
        })
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

    await ctx.repos.memberRepo
      .create({
        householdId: newHousehold.id,
        userId: ctx.authUser.id,
        roleId: 1,
      })
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return newHousehold
  })
