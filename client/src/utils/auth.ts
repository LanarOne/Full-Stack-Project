import type { AuthUser } from '@server/shared/types.ts'

// HANDLE ERRORS!!!
const TOKEN_KEY = 'token'

export function getStoredAccessToken(storage: Storage): string | null {
  return storage.getItem(TOKEN_KEY)
}

export function clearStoredAccessToken(storage: Storage): void {
  storage.removeItem(TOKEN_KEY)
}

export function storeAccessToken(storage: Storage, token: string): void {
  storage.setItem(TOKEN_KEY, token)
}

export function getUserFromToken(token: string): AuthUser {
  return JSON.parse(atob(String(token.split('.')[1]))).user
}

export function getHouseholdFromToken(token: string): { id: number } {
  const result = JSON.parse(atob(String(token.split('.')[1])))

  return result
}

export function getUserIdFromToken(token: string) {
  return getUserFromToken(token).id
}
