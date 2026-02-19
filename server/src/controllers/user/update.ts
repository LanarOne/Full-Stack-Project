import provideRepos from '@server/trpc/provideRepos'
import { authedProcedure } from '@server/trpc/authedProcedure'
import { userSchema } from '@server/entities/user'
import { userRepo } from '@server/repositories/userRepo'
import { handleKyselyErrors } from '@server/utils/errors'

export default authedProcedure
  .use(provideRepos({ userRepo }))
  .input(
    userSchema
      .pick({
        id: true,
        name: true,
        diet: true,
        allergies: true,
      })
      .partial({
        name: true,
        diet: true,
        allergies: true,
      })
      .strict()
  )
  .mutation(
    async ({ input: user, ctx: { repos } }) => {
      try {
        const { id, name, diet, allergies } = user

        return await repos.userRepo.update({
          id,
          name,
          diet,
          allergies,
        })
      } catch (error) {
        handleKyselyErrors(error)
      }
    }
  )
