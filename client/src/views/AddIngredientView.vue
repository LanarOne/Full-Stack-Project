<script setup lang="ts">
import PageForm from '@/components/PageForm.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { FwbInput, FwbSelect, FwbButton } from 'flowbite-vue'
import { type UserStore, useUserStore } from '@/stores/user.ts'
import { trpc } from '@/trpc.ts'
import { type HouseholdStore, useHouseholdStore } from '@/stores/household.ts'
import { parseYMD } from '@/helpers/dates.ts'

const router = useRouter()

const userStore: UserStore = useUserStore()
const householdStore: HouseholdStore = useHouseholdStore()

type NewIngredientForm = {
  name: string
  type: string
  quantity: number
  unit: '' | 'grams' | 'unit' | 'ml'
  purchaseDate: string
  expiryDate: string
  storage: '' | 'fridge' | 'freezer' | 'dry storage'
  notifInterval: number | null
  isReady: boolean
  note: string | null
}

const ingredientForm = ref<NewIngredientForm>({
  name: '',
  type: '',
  quantity: 0,
  unit: '',
  purchaseDate: '',
  expiryDate: '',
  storage: '',
  notifInterval: null,
  isReady: true,
  note: '',
})

const units = [
  { value: 'grams', name: 'Grams' },
  { value: 'unit', name: 'Unit' },
  { value: 'ml', name: 'Milliliter' },
]

const storages = [
  { value: 'dry storage', name: 'Dry Storage' },
  { value: 'freezer', name: 'Freezer' },
  { value: 'fridge', name: 'Fridge' },
]

async function handleSubmit() {
  userStore.isLoading = true

  try {
    if (ingredientForm.value.unit === '') {
      userStore.setError('Please select a unit')
      return
    }

    if (ingredientForm.value.storage === '') {
      userStore.setError('Please select a storage')
      return
    }

    await trpc.ingredient.create.mutate({
      name: ingredientForm.value.name,
      type: ingredientForm.value.type,
      quantity: ingredientForm.value.quantity,
      unit: ingredientForm.value.unit,
      purchaseDate: parseYMD(ingredientForm.value.purchaseDate),
      expiryDate: parseYMD(ingredientForm.value.expiryDate),
      storage: ingredientForm.value.storage,
      notifInterval: ingredientForm.value.notifInterval,
      isReady: ingredientForm.value.isReady,
      note: ingredientForm.value.note,
    })

    await router.push({ name: 'Household', params: { id: householdStore.currentHHId } })
  } catch (error) {
    userStore.setError(error instanceof Error ? error.message : 'Creation failed')
  } finally {
    userStore.isLoading = false
  }
}
</script>

<template>
  <PageForm heading="New Ingredient" form-label="New Ingredient" @submit="handleSubmit">
    <fwb-input
      v-model="ingredientForm.name"
      label="Ingredient name"
      type="text"
      name="name"
      required
    />
    <fwb-input
      v-model="ingredientForm.type"
      label="Ingredient type"
      type="text"
      name="type"
      required
    />
    <fwb-input
      v-model="ingredientForm.quantity"
      label="Ingredient quantity"
      type="number"
      name="quantity"
      required
    />
    <fwb-select v-model="ingredientForm.unit" :options="units" label="Select a unit" required />
    <fwb-input
      v-model="ingredientForm.purchaseDate"
      label="Ingredient purchaseDate"
      type="date"
      name="purchaseDate"
      required
    />
    <fwb-input
      v-model="ingredientForm.expiryDate"
      label="Ingredient expiryDate"
      type="date"
      name="expiryDate"
      required
    />
    <fwb-select
      v-model="ingredientForm.storage"
      :options="storages"
      label="Select a storage"
      required
    />
    <fwb-button gradient="teal-lime" outline type="submit" :disabled="userStore.isLoading">{{
      userStore.isLoading ? 'Loading...' : 'Create'
    }}</fwb-button>
  </PageForm>
</template>

<style scoped></style>
