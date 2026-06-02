<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.ts'
import { useHouseholdStore } from '@/stores/household.ts'
import PageForm from '@/components/PageForm.vue'
import { computed, onMounted, ref } from 'vue'
import { FwbInput, FwbButton } from 'flowbite-vue'
import { trpc } from '@/trpc.ts'

const router = useRouter()
const route = useRoute()

const userStore = useUserStore()
const householdStore = useHouseholdStore()

const isLoading = computed(() => userStore.isLoading || householdStore.isLoading)
const householdId = computed(() => Number(route.params.id))

const userEmail = ref('')

onMounted(() => {
  userStore.setError(null)
  householdStore.clearError()
})

async function handleSubmit() {
  userStore.isLoading = true
  householdStore.isLoading = true
  try {
    const user = await trpc.user.getByEmail.query({ email: userEmail.value })
    await trpc.member.create.mutate({ userId: user.id, householdId: householdId.value } as never)
    await router.push(`/household/${householdId.value}`)
  } catch (error) {
    userStore.setError(error instanceof Error ? error.message : 'Invite failed')
  } finally {
    userStore.isLoading = false
    householdStore.isLoading = false
  }
}
</script>

<template>
  <PageForm heading="Invite new member" form-label="New member" @submit="handleSubmit">
    <fwb-input
      v-model="userEmail"
      placeholder="Enter email"
      label="Member Email"
      type="email"
      name="email"
      required
    />
    <fwb-button type="submit" gradient="red-yellow" :disabled="isLoading" data-testid="submitBtn"
      >Submit</fwb-button
    >
  </PageForm>
</template>

<style scoped></style>
