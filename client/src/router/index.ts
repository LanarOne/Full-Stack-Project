import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'
import SignupView from '../views/SignupView.vue'
import LoginView from '@/views/LoginView.vue'
import CreateHouseholdView from '@/views/CreateHouseholdView.vue'
import HouseholdView from '@/views/HouseholdView.vue'
import { useUserStore } from '@/stores/user.ts'
import AddIngredientView from '@/views/AddIngredientView.vue'
import AddRecipeView from '@/views/AddRecipeView.vue'
import { useHouseholdStore } from '@/stores/household.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'household/create',
          name: 'create-household',
          component: CreateHouseholdView,
        },
        {
          path: 'household/:id',
          name: 'Household',
          component: HouseholdView,
        },
        {
          path: 'household/:id/create-ingredient',
          name: 'create-ingredient',
          component: AddIngredientView,
        },
        {
          path: 'household/:id/create-recipe',
          name: 'create-recipe',
          component: AddRecipeView,
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const householdStore = useHouseholdStore()

  if (!userStore.isBootstrapped) {
    await userStore.fetchUser()
  }

  if (!householdStore.households || householdStore.households.length === 0) {
    await householdStore.fetchHousehold()
  }

  if (!userStore.isLogged && to.name !== 'login' && to.name !== 'signup') {
    return { name: 'login' }
  }

  if (userStore.isLogged && (to.name === 'login' || to.name === 'signup')) {
    return { name: 'home' }
  }
})

export default router
