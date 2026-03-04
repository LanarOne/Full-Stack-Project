import provideRepos from '@server/trpc/provideRepos/index.js'
import { authedProcedure } from '@server/trpc/authedProcedure/index.js'
import { userSchema } from '@server/entities/user.js'
import { userRepo } from '@server/repositories/userRepo.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default authedProcedure
  .use(provideRepos({ userRepo }))
  .input(
    userSchema
      .pick({
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
  .mutation(async ({ input: user, ctx }) => {
    const { name, diet, allergies } = user

    const result = await ctx.repos.userRepo
      .update({
        id: ctx.authUser.id,
        name,
        diet,
        allergies,
      })
      .catch((error: unknown) =>
        handleKyselyErrors(error)
      )

    return result
  })
