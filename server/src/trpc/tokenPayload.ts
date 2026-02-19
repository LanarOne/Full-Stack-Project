import { z } from 'zod'
import {
  type AuthUser,
  authUserSchema,
} from '@server/entities/user'
import {
  type AuthHousehold,
  authHouseholdSchema,
} from '@server/entities/household'

const userOnlyTokenPayloadSchema = z.object({
  user: authUserSchema,
})

const tokenPayloadSchema = z.object({
  user: authUserSchema,
  household: authHouseholdSchema,
})

type UserOnlyTokenPayload = z.infer<
  typeof userOnlyTokenPayloadSchema
>
type TokenPayload = z.infer<
  typeof tokenPayloadSchema
>

export function prepareTokenPayload(
  user: AuthUser,
  household?: AuthHousehold
): TokenPayload | UserOnlyTokenPayload {
  if (!household) {
    return userOnlyTokenPayloadSchema.parse({
      user,
    })
  }
  return tokenPayloadSchema.parse({
    user,
    household,
  })
}

export function parseTokenPayload(
  tokenVerified: unknown
): TokenPayload | UserOnlyTokenPayload {
  const householdVerified =
    tokenPayloadSchema.safeParse(tokenVerified)

  return householdVerified.success
    ? householdVerified.data
    : userOnlyTokenPayloadSchema.parse(
        tokenVerified
      )
}
