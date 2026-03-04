import type {
  Context,
  ContextMinimal,
} from '@server/trpc/index.js'
import {
  type AuthUser,
  authUserSchema,
} from '@server/entities/user.js'
import {
  fakeAuthHousehold,
  fakeAuthUser,
} from '@server/entities/test/fakes.js'
import {
  type AuthHousehold,
  authHouseholdSchema,
} from '@server/entities/household.js'

export const requestContext = (
  context: Partial<Context> & ContextMinimal
): Context => ({
  req: {
    header: () => undefined,
    get: () => undefined,
  } as any,
  res: {
    cookie: () => undefined,
  } as any,
  ...context,
})

export const authContext = (
  context: Partial<Context> & ContextMinimal,
  user: AuthUser = fakeAuthUser(),
  household: AuthHousehold = fakeAuthHousehold()
): Context => ({
  authUser: authUserSchema.parse(user),
  authHousehold:
    authHouseholdSchema.parse(household),
  ...context,
})

export const authRepoContext = (
  repos: any,
  user: AuthUser = fakeAuthUser()
): Context => ({
  authUser: authUserSchema.parse(user),
  ...requestContext({
    db: {} as any,
    repos,
  }),
})
