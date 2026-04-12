<script setup lang="ts">
import { ref } from 'vue'
import { trpc } from '@/trpc.ts'
import { FwbButton, FwbInput, FwbAlert } from 'flowbite-vue'
import PageForm from '@/components/PageForm.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const userForm = ref({
  email: '',
  password: '',
  name: '',
  diet: '',
  allergies: '',
  profilePicture: '',
})

const succeeded = ref(false)
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

async function handleSubmit() {
  isLoading.value = true
  if (userForm.value.profilePicture === '') {
    userForm.value.profilePicture = 'http://placeholderimage.com'
  }
  try {
    await trpc.user.signup.mutate(userForm.value)

    succeeded.value = true

    await router.push({ name: 'login' })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Signup Failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <PageForm heading="Sign Up!" form-label="Signup" @submit="handleSubmit" class="bg-black"
    ><fwb-input v-model="userForm.email" type="email" placeholder="Email" name="email" required />
    <fwb-input
      v-model="userForm.password"
      type="password"
      placeholder="Your password"
      name="password"
      required
    />
    <fwb-input
      v-model="userForm.name"
      data-testid="name"
      type="text"
      placeholder="Your name"
      name="email"
      required
    />
    <fwb-input
      v-model="userForm.diet"
      data-testid="diet"
      type="text"
      placeholder="Your diet"
      name="diet"
    />
    <fwb-input
      v-model="userForm.allergies"
      data-testid="allergies"
      type="text"
      placeholder="Your allergies"
      name="allergies"
    />
    <fwb-input
      v-model="userForm.profilePicture"
      type="text"
      placeholder="Your profile picture"
      name="profilePicture"
    />
    <div class="flex justify-center">
      <fwb-button
        gradient="purple-pink"
        outline
        type="submit"
        :disabled="isLoading"
        data-testid="submitBtn"
      >
        {{ isLoading ? 'Loading...' : 'Signup' }}
      </fwb-button>
    </div></PageForm
  >
  <fwb-alert v-if="errorMessage" data-testid="errorMessage">{{ errorMessage }}</fwb-alert>
  <fwb-alert v-if="succeeded" data-testid="successMessage">Signup succeeded</fwb-alert>
</template>
