import { publicProcedure } from '@server/trpc'
import provideRepos from '@server/trpc/provideRepos'
import { userRepo } from '@server/repositories/userRepo'
import { userSchema } from '@server/entities/user'
import { hash } from 'bcrypt'
import config from '@server/config'
import { handleKyselyErrors } from '@server/utils/errors'

export default publicProcedure
  .use(provideRepos({ userRepo }))
  .input(
    userSchema.pick({
      email: true,
      password: true,
      name: true,
      diet: true,
      allergies: true,
    })
  )
  .mutation(
    async ({ input: user, ctx: { repos } }) => {
      try {
        const passwordHash = await hash(
          user.password,
          config.auth.passwordCost
        )

        const created =
          await repos.userRepo.create({
            ...user,
            password: passwordHash,
          })

        return {
          id: created.id,
        }
      } catch (error) {
        handleKyselyErrors(error)
      }
    }
  )
