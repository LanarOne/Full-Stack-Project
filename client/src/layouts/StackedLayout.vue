<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import {
  FwbNavbar,
  FwbNavbarLogo,
  FwbNavbarCollapse,
  FwbNavbarLink,
  FwbAlert,
  FwbButton,
} from 'flowbite-vue'
import { useUserStore } from '@/stores/user.ts'
import { useHouseholdStore } from '@/stores/household.ts'

const userStore = useUserStore()
const householdStore = useHouseholdStore()

type NavLink = {
  label: string
  to: { name: string; params?: Record<string, string | number> }
}
const { links } = defineProps<{
  links: NavLink[]
}>()

const route = useRoute()

const nav = computed(() =>
  links.map((item) => ({
    ...item,
    isActive: route.name === item.to.name,
  })),
)

function dismissNotif() {
  userStore.clearError()
  householdStore.clearError()
}
</script>

<template>
  <fwb-navbar>
    <template #logo>
      <fwb-navbar-logo> </fwb-navbar-logo>
      <h1 v-if="userStore.isLogged && userStore.user" class="text-white">
        {{ userStore.user.name }}
      </h1>
    </template>
    <template #default="{ isShowMenu }">
      <fwb-navbar-collapse :is-show-menu="isShowMenu" data-testid="navCollapse">
        <fwb-navbar-link
          v-for="link in nav"
          :key="`${link.label.split(' ')[0]}-${JSON.stringify(link.to)}`"
          :is-active="link.isActive"
          :link="link.to as any"
          link-attr="to"
          component="RouterLink"
        >
          {{ link.label }}</fwb-navbar-link
        >
        <slot name="menu" />
      </fwb-navbar-collapse>
    </template>
  </fwb-navbar>
  <main>
    <div
      class="container max-w-full px-6 py-6 bg-black text-white flex flex-col justify-center items-center min-h-screen"
    >
      <RouterView />
      <fwb-alert v-if="householdStore.error" type="danger" class="mt-3"
        >{{ householdStore.error }} <fwb-button color="light" @click="dismissNotif">X</fwb-button>
      </fwb-alert>
      <fwb-alert v-if="userStore.error" type="warning" class="mt-3"
        >{{ userStore.error
        }}<fwb-button color="light" @click="dismissNotif">X</fwb-button></fwb-alert
      >
    </div>
  </main>
</template>
