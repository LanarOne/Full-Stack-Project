import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { UserPublic } from '@server/entities/user.ts'
import { trpc } from '@/trpc.ts'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserPublic | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isBootstrapped = ref(false)

  const isLogged = computed(() => !!user.value)
  const _hasPP = computed(() => !!user.value?.profilePicture)

  function setUser(newUser: UserPublic) {
    user.value = newUser
  }
  function setError(message: string | null) {
    error.value = message
  }

  function clearError() {
    error.value = null
  }

  async function fetchUser() {
    isLoading.value = true
    setError(null)

    try {
      user.value = await trpc.user.getById.query(undefined, undefined)
    } catch (error) {
      user.value = null
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      isLoading.value = false
      isBootstrapped.value = true
    }
  }

  async function logOut() {
    isLoading.value = true
    setError(null)

    try {
      await trpc.user.logout.mutate()

      user.value = null
      isBootstrapped.value = true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logout failed')
    } finally {
      isLoading.value = false
    }
  }

  function updateUser(partialUser: Partial<UserPublic>) {
    if (!user.value) return
    user.value = { ...user.value, ...partialUser }
  }

  return {
    user,
    isLoading,
    error,
    setUser,
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
