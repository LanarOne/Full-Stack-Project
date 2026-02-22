import config from '@server/config'
import { publicProcedure } from '@server/trpc'
import provideRepos from '@server/trpc/provideRepos'
import { userRepo } from '@server/repositories/userRepo'
import { userSchema } from '@server/entities/user'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcrypt'
import { prepareTokenPayload } from '@server/trpc/tokenPayload'
import jsonwebtoken from 'jsonwebtoken'
import { handleKyselyErrors } from '@server/utils/errors'

const { tokenKey } = config.auth

export default publicProcedure
  .use(provideRepos({ userRepo }))
  .input(
    userSchema.pick({
      email: true,
      password: true,
    })
  )
  .mutation(
    async ({
      input: { email, password },
      ctx: { repos },
    }) => {
      try {
        const user =
          await repos.userRepo.findByEmail(email)

        const passwordMatch =
          await bcrypt.compare(
            password,
            user.password
          )

        if (!passwordMatch) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Incorrect password',
          })
        }

        const payload = prepareTokenPayload({
          id: Number(user.id),
          email: user.email,
        })

        const token = jsonwebtoken.sign(
          payload,
          tokenKey,
          { expiresIn: '24h' }
        )

        return { token }
      } catch (error) {
        return handleKyselyErrors(error)
      }
    }
  )
