<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { trpc } from '@/trpc.ts'
import { useUserStore } from '@/stores/user.ts'
import { useHouseholdStore } from '@/stores/household.ts'
import { FwbButton, FwbCard } from 'flowbite-vue'
import type { RecipePublic, UserPublic } from '@server/shared/types.ts'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const householdStore = useHouseholdStore()
const isLoading = computed(() => userStore.isLoading || householdStore.isLoading)

const recipes = ref<RecipePublic[]>([])
const members = ref<UserPublic[]>([])

async function redirectTo(url: string) {
  await router.push(url)
}

async function deleteMember(userId: number) {
  householdStore.isLoading = true
  try {
    const householdId = Number(route.params.id)
    await trpc.member.remove.mutate({ userId, householdId } as never)

    const response = await trpc.member.getByHouseholdId.query({ householdId } as never)

    const memberIds = [...new Set(response.map((member) => member.userId))]
    members.value = await Promise.all(
      memberIds.map((memberId) => trpc.user.getByGivenId.query({ id: Number(memberId) })),
    )
  } catch (error) {
    householdStore.error = error instanceof Error ? error.message : 'Something went wrong'
  } finally {
    householdStore.isLoading = false
  }
}

onMounted(async () => {
  userStore.isLoading = true
  householdStore.isLoading = true
  userStore.setError(null)
  householdStore.clearError()
  try {
    const id = Number(route.params.id)

    householdStore.currentHHId = id
    await householdStore.getCurrent()

    const [memberResponse, recipeResponse] = await Promise.all([
      trpc.member.getByHouseholdId.query({ householdId: id } as never),
      trpc.recipe.getByHouseholdId.query({ householdId: id } as never),
    ])

    recipes.value = recipeResponse

    const membersId = [...new Set(memberResponse.map((member) => member.userId))]
    members.value = await Promise.all(
      membersId.map((memberId) => trpc.user.getByGivenId.query({ id: Number(memberId) })),
    )
  } catch (error) {
    userStore.setError(error instanceof Error ? error.message : 'Unknown error')
    setTimeout(async () => {
      await router.push({ name: 'home' })
    }, 5000)
  } finally {
    userStore.isLoading = false
    householdStore.isLoading = false
  }
})
</script>

<template>
  <h2 v-if="isLoading">Loading...</h2>
  <h2 v-else-if="householdStore.current" data-testid="householdHeading">
    {{ householdStore.current?.name }}'s Household !
  </h2>
  <h2 v-else data-testid="failedHeading">No household found.</h2>
  <article class="flex gap-4 items-start justify-center mt-8">
    <aside class="w-64 shrink-0">
      <div>
        <h2>Members</h2>
        <ul>
          <li v-for="member in members" class="flex items-center" :key="member.name + member.id">
            <h3>{{ member.name }}</h3>
            <fwb-button
              v-if="householdStore.isAdmin"
              size="xs"
              class="m-3 p-1"
              type="button"
              @click="deleteMember(member.id)"
              color="red"
              >x</fwb-button
            >
          </li>
        </ul>
      </div>
      <fwb-button
        v-if="householdStore.currentHHId"
        class="m3"
        gradient="red-yellow"
        type="button"
        @click="redirectTo(`${householdStore.currentHHId}/add-member`)"
        data-testid="addMemberBtn"
        >Add member</fwb-button
      >
    </aside>
    <section class="w-full max-w-xl">
      <fwb-button
        class="m-3"
        gradient="pink-orange"
        type="button"
        @click="redirectTo(`${householdStore.currentHHId}/storage`)"
        data-testid="storageBtn"
        >Storage</fwb-button
      >

      <fwb-button
        v-if="householdStore.currentHHId"
        class="m-3"
        gradient="teal-lime"
        type="button"
        data-testid="createIngrBtn"
        @click="redirectTo(`${householdStore.currentHHId}/create-ingredient`)"
        >Add Ingredient</fwb-button
      >

      <fwb-button
        class="m-3"
        gradient="teal-lime"
        type="button"
        @click="redirectTo(`${householdStore.currentHHId}/create-recipe`)"
        >Add Recipe</fwb-button
      >

      <fwb-card
        v-for="recipe in recipes"
        :key="recipe.id"
        class="max-w-full px-3 py-3 text-center mt-3"
      >
        <h3 class="font-bold text-xl">{{ recipe.name }}</h3>
        <p>{{ recipe.description }}</p>
        <p>{{ recipe?.tips }}</p>
        <p>Preparation time: {{ recipe?.prepTime }} minutes</p>
        <p>Number of portions: {{ recipe?.portions }}</p>
      </fwb-card>
    </section>
  </article>
</template>

<style scoped></style>
