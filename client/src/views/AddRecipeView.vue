<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.ts'
import { computed, ref } from 'vue'
import { trpc } from '@/trpc.ts'
import PageForm from '@/components/PageForm.vue'
import { FwbInput, FwbTextarea, FwbToggle, FwbButton } from 'flowbite-vue'

const router = useRouter()
const route = useRoute()

const userStore = useUserStore()

const householdId = computed(() => Number(route.params.id))

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
    if (!Number.isInteger(householdId.value) || householdId.value <= 0) {
      userStore.setError('Invalid household id')
      return
    }
    await trpc.recipe.create.mutate({
      householdId: householdId.value,
      ...recipeForm.value,
    } as never)

    await router.push({ name: 'Household', params: { id: householdId.value } })
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
    <fwb-button
      data-testid="createRecipeBtn"
      class="mt-3"
      gradient="cyan-blue"
      type="submit"
      :disabled="userStore.isLoading"
      >{{ userStore?.isLoading ? 'Loading' : 'Create' }}</fwb-button
    >
  </PageForm>
</template>

<style scoped></style>
