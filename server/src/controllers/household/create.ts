import provideRepos from '@server/trpc/provideRepos'
import { authedProcedure } from '@server/trpc/authedProcedure'
import { householdRepo } from '@server/repositories/householdRepo'
import { householdSchema } from '@server/entities/household'
import { handleKyselyErrors } from '@server/utils/errors'
import { memberRepo } from '@server/repositories/memberRepo'

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
  .mutation(
    async ({
      input,
      ctx: { authUser, repos },
    }) => {
      const { name, profilePicture } = input

      const newHousehold =
        await repos.householdRepo
          .create({
            name,
            profilePicture,
          })
          .catch((error) =>
            handleKyselyErrors(error)
          )

      await repos.memberRepo
        .create({
          householdId: newHousehold.id,
          userId: authUser.id,
          roleId: 1,
        })
        .catch((error) =>
          handleKyselyErrors(error)
        )

      return newHousehold
    }
  )
