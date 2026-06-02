import { defineStore } from 'pinia'
import { ref } from 'vue'
import { trpc } from '@/trpc.ts'
import type { HouseholdPublic } from '@server/entities/household.ts'

export const useHouseholdStore = defineStore('household', () => {
  const households = ref<HouseholdPublic[]>([])
  const current = ref<HouseholdPublic | null>(null)
  const currentHHId = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAdmin = ref(false)

  async function fetchHousehold() {
    isLoading.value = true

    try {
      const isMember = await trpc.member.getByUserId.query(undefined)

      const householdIds = [...new Set(isMember.map((member) => member.householdId))]

      households.value = await Promise.all(
        householdIds.map((id) => trpc.household.getById.query({ id: Number(id) })),
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      households.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function getCurrent() {
    isLoading.value = true
    clearError()
    try {
      const existing = households.value.find(
        (household) => household.id === Number(currentHHId.value),
      )
      current.value =
        existing ?? (await trpc.household.getById.query({ id: Number(currentHHId.value) }))

      const currentAdmin = await trpc.member.getOne.query({
        householdId: Number(currentHHId.value),
      })

      isAdmin.value = currentAdmin.result.roleId === 1
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  function clearHouseholds() {
    households.value = []
    error.value = null
    isLoading.value = false
  }

  function clearError() {
    error.value = null
  }
  return {
    households,
    isLoading,
    error,
    fetchHousehold,
    clearHouseholds,
    clearError,
    currentHHId,
    getCurrent,
    current,
    isAdmin,
  }
})

export type HouseholdStore = ReturnType<typeof useHouseholdStore>
