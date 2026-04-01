import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { UserPublic } from '@server/entities/user.ts'
import { clearStoredAccessToken, getStoredAccessToken } from '@/utils/auth.ts'
import { trpc } from '@/trpc.ts'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserPublic | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isBootstrapped = ref(false)

  const isLogged = computed(() => !!user.value && !!token.value)
  const _hasPP = computed(() => !!user.value?.profilePicture)

  function setUser(newUser: UserPublic) {
    user.value = newUser
  }

  function setToken(newToken: string | null) {
    token.value = newToken
  }

  function setError(message: string) {
    error.value = message
  }

  function clearError() {
    error.value = null
  }

  async function fetchUser() {
    isLoading.value = true
    clearError()

    try {
      const storedToken = getStoredAccessToken(window.localStorage)
      if (!storedToken) {
        token.value = null
        user.value = null
        return
      }
      token.value = storedToken

      user.value = await trpc.user.getById.query(undefined, undefined)
    } catch (error) {
      token.value = null
      user.value = null
      clearStoredAccessToken(window.localStorage)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      isLoading.value = false
      isBootstrapped.value = true
    }
  }

  function logOut() {
    user.value = null
    token.value = null
    error.value = null
    isLoading.value = false
    clearStoredAccessToken(window.localStorage)
  }

  function updateUser(partialUser: Partial<UserPublic>) {
    if (!user.value) return
    user.value = { ...user.value, ...partialUser }
  }

  return {
    user,
    token,
    isLoading,
    error,
    setUser,
    setToken,
    clearError,
    logOut,
    updateUser,
    isLogged,
    setError,
    fetchUser,
    isBootstrapped,
  }
})

export type UserStore = ReturnType<typeof useUserStore>
