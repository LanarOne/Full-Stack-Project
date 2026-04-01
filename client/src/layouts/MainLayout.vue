<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user.ts'
import StackedLayout from '@/layouts/StackedLayout.vue'
import { FwbNavbarLink } from 'flowbite-vue'
import { useRouter } from 'vue-router'
import { useHouseholdStore } from '@/stores/household.ts'

const userStore = useUserStore()
const householdStore = useHouseholdStore()
const router = useRouter()

onMounted(async () => {
  await householdStore.fetchHousehold()
})
const links = computed(() => [
  { label: 'Home', to: { name: 'home' } },
  ...(userStore.isLogged
    ? [
        { label: 'Create household', to: { name: 'create-household' } },
        ...householdStore.households.map((household) => ({
          label: household.name,
          to: { name: 'Household', params: { id: household.id } },
        })),
      ]
    : [
        { label: 'Signup', to: { name: 'signup' } },
        { label: 'Login', to: { name: 'login' } },
      ]),
])

async function logOutUser() {
  userStore.logOut()
  await router.push({ name: 'login' })
}
</script>

<template>
  <StackedLayout :links="links">
    <template #menu>
      <fwb-navbar-link v-if="userStore.isLogged" @click.prevent="logOutUser" link="#">
        Logout
      </fwb-navbar-link>
    </template>
  </StackedLayout>
</template>
