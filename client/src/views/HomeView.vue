<script setup lang="ts">
import { FwbCard } from 'flowbite-vue'
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user.ts'
import { shiftYMD, toYMD } from '@/helpers/dates.ts'

const userStore = useUserStore()

onMounted(() => {
  userStore.clearError()
})

const today = toYMD(new Date())

const week = ref<string[]>([])
for (let i = 0; i < 7; i++) {
  week.value.push(shiftYMD(today, i))
}
</script>
<template>
  <h2 class="text-center font-bold">Today is: {{ today }}</h2>
  <div class="w-full col-span-7 flex flex-col justify-center items-center">
    <fwb-card v-for="day in week" :key="day" class="max-w-xs px-3 py-3 text-center mt-3">
      <h3>{{ day }}</h3>
    </fwb-card>
  </div>
</template>
