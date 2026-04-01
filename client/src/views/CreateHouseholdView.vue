<script setup lang="ts">
import PageForm from '@/components/PageForm.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useUserStore } from '@/stores/user.ts'
import { trpc } from '@/trpc.ts'
import { FwbInput, FwbButton, FwbAlert } from 'flowbite-vue'

const router = useRouter()

const userStore = useUserStore()

const householdForm = ref({
  name: '',
  profilePicture: '',
})
const succeeded = ref(false)

async function handleSubmit() {
  userStore.isLoading = true
  if (householdForm.value.profilePicture === '') {
    householdForm.value.profilePicture = 'https://placeholderpic.com'
  }
  try {
    await trpc.household.create.mutate(householdForm.value)

    succeeded.value = true
    setTimeout(async () => {
      await router.push({ name: 'home' })
    }, 2500)
  } catch (e) {
    userStore.setError(e instanceof Error ? e.message : String(e))
  } finally {
    userStore.isLoading = false
  }
}
</script>

<template>
  <PageForm heading="New Household !" form-label="New Household" @submit="handleSubmit">
    <fwb-input
      v-model="householdForm.name"
      type="text"
      placeholder="Your household's name"
      :required="true"
      data-testid="householdName"
    />
    <fwb-input
      v-model="householdForm.profilePicture"
      type="text"
      placeholder="Your profile picture"
      data-testid="householdPP"
    />
    <fwb-button
      data-testid="createBtn"
      type="submit"
      gradient="teal-lime"
      outline
      :disabled="userStore.isLoading"
      >{{ userStore.isLoading ? 'Loading...' : 'Create' }}</fwb-button
    >
  </PageForm>
  <fwb-alert v-if="succeeded" type="success" class="mt-3" data-testid="successMessage"
    >Your Household {{ householdForm.name }} was created successfully!</fwb-alert
  >
</template>

<style scoped></style>
