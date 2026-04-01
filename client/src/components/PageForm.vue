<script setup lang="ts">
import { FwbHeading } from 'flowbite-vue'

defineProps<{ heading: string; formLabel: string }>()

defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="flex-col justify-center items-center">
    <fwb-heading tag="h2">{{ heading }}</fwb-heading>

    <div class="mt-10 flex justify-center items-center">
      <form
        :aria-label="formLabel"
        @submit.prevent="$emit('submit')"
        class="w-full max-w-md space-y-6"
      >
        <slot />
      </form>
    </div>
  </div>
</template>

<style scoped></style>
