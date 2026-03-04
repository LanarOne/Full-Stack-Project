import { publicProcedure } from '@server/trpc/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { userRepo } from '@server/repositories/userRepo.js'
import { userSchema } from '@server/entities/user.js'
import { hash } from 'bcrypt'
import config from '@server/config.js'
import { handleKyselyErrors } from '@server/utils/errors.js'

export default publicProcedure
  .use(provideRepos({ userRepo }))
  .input(
    userSchema
      .pick({
        email: true,
        password: true,
        name: true,
        diet: true,
        allergies: true,
        profilePicture: true,
      })
      .partial({
        diet: true,
        allergies: true,
        profilePicture: true,
      })
      .strict()
  )
  .mutation(
    async ({
      input: user,
      ctx,
    }): Promise<{ id: number }> => {
      const passwordHash = await hash(
        user.password!,
        config.auth.passwordCost
      )

      const created = await ctx.repos.userRepo
        .create({
          ...user,
          password: passwordHash,
        })
        .catch((error: unknown) =>
          handleKyselyErrors(error)
        )

      return {
        id: created.id,
      }
    }
  )
