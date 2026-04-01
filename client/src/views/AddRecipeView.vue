<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.ts'
import { useHouseholdStore } from '@/stores/household.ts'
import { ref } from 'vue'
import { trpc } from '@/trpc.ts'
import PageForm from '@/components/PageForm.vue'
import { FwbInput, FwbTextarea, FwbToggle, FwbButton } from 'flowbite-vue'

const router = useRouter()

const userStore = useUserStore()
const householdStore = useHouseholdStore()

const recipeForm = ref({
  name: '',
  description: '',
  tips: '',
  portions: 0,
  prepTime: 0,
  img: null,
  vid: null,
  public: false,
})

async function handleSubmit() {
  userStore.isLoading = true
  try {
    await trpc.recipe.create.mutate(recipeForm.value)

    await router.push({ name: 'Household', params: { id: householdStore.currentHHId } })
  } catch (error) {
    userStore.setError(error instanceof Error ? error.message : 'Creation failed')
  } finally {
    userStore.isLoading = false
  }
}
</script>

<template>
  <PageForm heading="New Recipe" form-label="New Recipe" @submit="handleSubmit">
    <fwb-input v-model="recipeForm.name" label="Name" type="text" name="name" required />
    <fwb-textarea
      v-model="recipeForm.description"
      :rows="4"
      label="Description"
      type="text"
      name="description"
      required
    />
    <fwb-textarea
      v-model="recipeForm.tips"
      :rows="2"
      label="Tips"
      type="text"
      name="tips"
      required
    />
    <fwb-input
      v-model="recipeForm.portions"
      label="Portions"
      type="number"
      name="portions"
      required
    />
    <fwb-input
      v-model="recipeForm.prepTime"
      label="Preparation Time"
      type="number"
      name="prepTime"
      required
    />
    <fwb-toggle v-model="recipeForm.public" label="Is this recipe Public?" name="public" />
    <fwb-button class="mt-3" gradient="cyan-blue" type="submit" :disabled="userStore.isLoading">{{
      userStore?.isLoading ? 'Loading' : 'Create'
    }}</fwb-button>
  </PageForm>
</template>

<style scoped></style>
