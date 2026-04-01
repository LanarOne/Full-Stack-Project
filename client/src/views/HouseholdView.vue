<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { trpc } from '@/trpc.ts'
import { useUserStore } from '@/stores/user.ts'
import {
  clearStoredAccessToken,
  getHouseholdFromToken,
  getStoredAccessToken,
  storeAccessToken,
} from '@/utils/auth.ts'
import { useHouseholdStore } from '@/stores/household.ts'
import { FwbButton, FwbCard } from 'flowbite-vue'
import type { RecipePublic } from '@server/shared/types.ts'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const householdStore = useHouseholdStore()

const recipes = ref<RecipePublic[]>([])

async function redirectTo(url: string) {
  await router.push(url)
}

onMounted(async () => {
  userStore.isLoading = true
  userStore.clearError()
  try {
    const token = getStoredAccessToken(window.localStorage)

    const id = Number(route.params.id)

    if (token) {
      const isHHinToken = getHouseholdFromToken(token).id
      if (!isHHinToken) {
        const household = await trpc.household.getById.query({ id: id })

        const result = await trpc.member.getOne.query({ householdId: household.id })

        clearStoredAccessToken(window.localStorage)
        storeAccessToken(window.localStorage, result.token)
        userStore.setToken(result.token)
        householdStore.currentHHId = household.id
        await householdStore.getCurrent()

        recipes.value = await trpc.recipe.getByHouseholdId.query(undefined, undefined)
      }
      if (isHHinToken === id) {
        await householdStore.getCurrent()
        userStore.isLoading = false
        return
      }
    }
  } catch (error) {
    userStore.setError(error instanceof Error ? error.message : 'Unknown error')
    setTimeout(async () => {
      await router.push({ name: 'home' })
    }, 5000)
  } finally {
    userStore.isLoading = false
  }
})
</script>

<template>
  <h2 v-if="userStore.isLoading">Loading...</h2>
  <h2 v-else-if="householdStore.current" data-testid="householdHeading">
    {{ householdStore.current?.name }}'s Household !
  </h2>
  <h2 v-else data-testid="failedHeading">No household found.</h2>

  <fwb-button
    class="mt-3"
    gradient="teal-lime"
    type="button"
    @click="redirectTo(`${householdStore.currentHHId}/create-ingredient`)"
    >Add Ingredient</fwb-button
  >

  <fwb-button
    class="mt-3"
    gradient="teal-lime"
    type="button"
    @click="redirectTo(`${householdStore.currentHHId}/create-recipe`)"
    >Add Recipe</fwb-button
  >

  <fwb-card
    v-for="recipe in recipes"
    :key="recipe.id"
    class="max-w-full px-3 py-3 text-center mt-3"
  >
    <h3 class="font-bold text-xl">{{ recipe.name }}</h3>
    <p>{{ recipe.description }}</p>
    <p>{{ recipe?.tips }}</p>
    <p>Preparation time: {{ recipe?.prepTime }} minutes</p>
    <p>Number of portions: {{ recipe?.portions }}</p>
  </fwb-card>
</template>

<style scoped></style>
