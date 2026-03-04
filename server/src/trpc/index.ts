import type { Database } from '@server/database/index.js'
import { initTRPC } from '@trpc/server'
import SuperJSON from 'superjson'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'
import type { Request, Response } from 'express'
import type { Repositories } from '@server/repositories/index.js'
import type { AuthUser } from '@server/entities/user.js'
import type { AuthHousehold } from '@server/entities/household.js'

export type Context = {
  db: Database
  req?: Request
  res?: Response

  authUser?: AuthUser
  authHousehold?: AuthHousehold

  repos?: Partial<Repositories>
}

export type ContextMinimal = Pick<Context, 'db'>

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
  errorFormatter(options: any) {
    const { shape, error } = options

    if (error.cause instanceof ZodError) {
      const validationError = fromZodError(
        error.cause
      )

      return {
        ...shape,
        data: {
          message: validationError.message,
        },
      }
    }

    return shape
  },
})

export const {
  createCallerFactory,
  mergeRouters,
  middleware,
  procedure: publicProcedure,
  router,
} = t
