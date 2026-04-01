<script setup lang="ts">
import { onMounted } from 'vue'
import { initFlowbite } from 'flowbite'
import { useUserStore } from '@/stores/user.ts'

const userStore = useUserStore()
onMounted(async () => {
  initFlowbite()
  if (!userStore.isBootstrapped) {
    await userStore.fetchUser()
  }
})
</script>

<template>
  <RouterView />
</template>
