import config from '@server/config.js'
import { publicProcedure } from '@server/trpc/index.js'
import provideRepos from '@server/trpc/provideRepos/index.js'
import { userRepo } from '@server/repositories/userRepo.js'
import { userSchema } from '@server/entities/user.js'
import type { UserPublic } from '@server/entities/user.js'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcrypt'
import { prepareTokenPayload } from '@server/trpc/tokenPayload.js'
import jsonwebtoken from 'jsonwebtoken'
import { handleKyselyErrors } from '@server/utils/errors.js'

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
      ctx,
    }) => {
      try {
        const user =
          await ctx.repos.userRepo.findByEmail(
            email
          )

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
          {
            expiresIn: config.auth.expiresIn,
          } as jsonwebtoken.SignOptions
        )

        const {
          password: _password,
          ...safeUser
        } = user

        return {
          token,
          user: safeUser as UserPublic,
        }
      } catch (error) {
        return handleKyselyErrors(error)
      }
    }
  )
