import config from '@server/config'
import jsonwebtoken from 'jsonwebtoken'
import { parseTokenPayload } from '@server/trpc/tokenPayload'

const { tokenKey } = config.auth

export function verify(token: string) {
  return jsonwebtoken.verify(token, tokenKey)
}

export function getUserFromToken(token: string) {
  try {
    const tokenVerified = verify(token)
    const tokenParsed = parseTokenPayload(
      tokenVerified
    )

    return tokenParsed.user
  } catch (error) {
    return null
  }
}

export function getHouseholdFromToken(
  token: string
) {
  try {
    const tokenVerified = verify(token)
    const tokenParsed = parseTokenPayload(
      tokenVerified
    )

    if ('household' in tokenParsed) {
      return tokenParsed.household
    }

    return null
  } catch (error) {
    return null
  }
}
