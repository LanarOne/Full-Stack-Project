import 'dotenv/config'
import { z } from 'zod'

const { env } = process

if (!env.NODE_ENV) env.NODE_ENV = 'development'

env.TZ = 'UTC'

const isTest = env.NODE_ENV === 'test'
const isDevTest =
  env.NODE_ENV === 'development' || isTest

const schema = z
  .object({
    env: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    port: z.coerce.number().default(3000),

    auth: z.object({
      tokenKey: z.string().default(() => {
        if (isDevTest) {
          return 'supersecretkey'
        }

        throw new Error(
          'You must provide a TOKEN_KEY in a production environment!'
        )
      }),
      expiresIn: z.string().default('7d'),
      passwordCost: z.coerce
        .number()
        .default(isDevTest ? 6 : 12),
    }),

    database: z.object({
      connectionString: z.string().url(),
    }),
  })
  .readonly()

const config = schema.parse({
  env: env.NODE_ENV,
  port: env.PORT,

  auth: {
    tokenKey: env.TOKEN_KEY,
    expiresIn: env.TOKEN_EXPIRES_IN,
    passwordCost: env.PASSWORD_COST,
  },

  database: {
    connectionString: isDevTest
      ? env.TEST_DATABASE_URL
      : env.DATABASE_URL,
  },
})

export default config
