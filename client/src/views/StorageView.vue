<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {useUserStore} from "@/stores/user.ts";
import {useHouseholdStore} from "@/stores/household.ts";
import {onMounted, ref} from "vue";
import type {IngredientPublic} from "@server/shared/types.ts";
import {trpc} from "@/trpc.ts";
import {FwbCard} from "flowbite-vue";

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const householdStore = useHouseholdStore()
const isLoading = userStore.isLoading || householdStore.isLoading

const ingredients = ref<IngredientPublic[]>([])
const fridge = ref<IngredientPublic[]>([])
const freezer = ref<IngredientPublic[]>([])
const dryStorage = ref<IngredientPublic[]>([])

onMounted(async () => {
  userStore.clearError()
  householdStore.clearError()
  userStore.isLoading = true
  householdStore.isLoading = true
  try {
    if (!householdStore.currentHHId || householdStore.currentHHId !== Number(route.params.id)) {
      userStore.setError('Household not found')
      setTimeout(async () => {
        await router.push(`/`)
      }, 1500)
    } else {
      ingredients.value = await trpc.ingredient.getByHouseholdId.query(undefined, undefined)
      for (const ingredient of ingredients.value) {
        if (ingredient.storage === 'dry storage') {
          dryStorage.value.push(ingredient)
        } else if (ingredient.storage === 'fridge') {
          fridge.value.push(ingredient)
        } else if (ingredient.storage === 'freezer') {
          freezer.value.push(ingredient)
        }
      }
    }
  } catch (error) {
    userStore.setError(error instanceof Error ? error.message : 'Something went wrong')
  } finally {
    userStore.isLoading = false
    householdStore.isLoading = false
  }
})
</script>

<template>
  <h2 v-if="isLoading">Loading...</h2>
  <h2 v-else-if="householdStore.current" data-testid="householdHeading">
    {{ householdStore.current?.name }}'s Household !
  </h2>
  <h2 v-else data-testid="failedHeading">No household found.</h2>
<article class="flex flex-wrap justify-center gap-4 mt-3">
  <section class="flex-1 justify-center items-center gap-2.5 mt-3">
    <h3>Dry Storage</h3>
    <fwb-card v-for="ingredient in dryStorage" :key="ingredient.name" class="mt-3 flex justify-center items-center">
      <h4>{{ingredient.name}}</h4>
      <p>{{ingredient.type}}</p>
        <p>{{ingredient.quantity}} {{ingredient.unit}}</p>
      <p>purchased: {{ingredient.purchaseDate.toDateString()}}</p>
      <p>expiring: {{ingredient.expiryDate.toDateString()}}</p>
    </fwb-card>
  </section>
  <section class="flex-1 justify-center items-center gap-2.5 mt-3">
    <h3>Freezer</h3>
    <fwb-card v-for="ingredient in freezer" :key="ingredient.name" class="mt-3 flex justify-center items-center">
      <h4>{{ingredient.name}}</h4>
      <p>{{ingredient.type}}</p>
      <p>{{ingredient.quantity}} {{ingredient.unit}}</p>
      <p>purchased: {{ingredient.purchaseDate.toDateString()}}</p>
      <p>expiring: {{ingredient.expiryDate.toDateString()}}</p>
    </fwb-card>
  </section>
  <section class="flex-1 justify-center items-center gap-2.5 mt-3">
    <h3>Fridge</h3>
    <fwb-card v-for="ingredient in fridge" :key="ingredient.name" class="mt-3 flex justify-center items-center">
      <h4>{{ingredient.name}}</h4>
      <p>{{ingredient.type}}</p>
      <p>{{ingredient.quantity}} {{ingredient.unit}}</p>
      <p>purchased: {{ingredient.purchaseDate.toDateString()}}</p>
      <p>expiring: {{ingredient.expiryDate.toDateString()}}</p>
    </fwb-card>
  </section>
</article>
</template>

<style scoped>

</style>
