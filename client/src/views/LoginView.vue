<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.ts'
import { ref } from 'vue'
import { trpc } from '@/trpc.ts'
import PageForm from '@/components/PageForm.vue'
import { FwbInput, FwbAlert, FwbButton } from 'flowbite-vue'
import { storeAccessToken } from '@/utils/auth.ts'
import type { UserPublic } from '@server/entities/user.ts'

const router = useRouter()

const userStore = useUserStore()

const userForm = ref({
  email: '',
  password: '',
})

const succeeded = ref(false)
const errorMessage = ref<string | null | unknown>(null)
const isLoading = ref(false)

async function submitLogin() {
  isLoading.value = true
  try {
    const result = await trpc.user.login.mutate(userForm.value)

    succeeded.value = true

    userStore.setUser(result.user as UserPublic)
    userStore.setToken(result.token)

    storeAccessToken(window.localStorage, result.token)

    await router.push({ name: 'home' })
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : error
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <PageForm
    heading="Log In"
    aria-label="Login form"
    data-testid="loginForm"
    form-label="Login"
    @submit="submitLogin"
    class="bg-black"
  >
    <template #default>
      <fwb-input
        label="Email"
        v-model="userForm.email"
        type="email"
        name="email"
        :required="true"
        placeholder="Your e-mail"
      />
      <fwb-input
        v-model="userForm.password"
        label="Password"
        type="password"
        name="password"
        :required="true"
        placeholder="Your password"
      />

      <fwb-alert v-if="errorMessage" data-testid="errorMessage" type="warning">{{
        errorMessage
      }}</fwb-alert>

      <fwb-alert v-if="succeeded" data-testid="successMessage" type="success"
        >Logged in successfully</fwb-alert
      >

      <div class="flex justify-center">
        <fwb-button gradient="purple-pink" outline type="submit" :disabled="isLoading">
          {{ isLoading ? 'Loading...' : 'Login' }}
        </fwb-button>
      </div>
    </template>
  </PageForm>
  <div class="flex justify-center mt-3">
    <fwb-button gradient="teal-lime" outline type="button" :disabled="isLoading" href="/signup"
      >Signup</fwb-button
    >
  </div>
</template>

<style scoped></style>
