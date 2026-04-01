import { Chance } from 'chance'
import type { Insertable } from 'kysely'
import type {
  Household,
  Ingredient,
  Leftover,
  Meal,
  Member,
  Participant,
  RcpIngr,
  Recipe,
  User,
} from '@server/database/types.js'
import type { AuthUser } from '@server/entities/user.js'
import type { AuthHousehold } from '@server/entities/household.js'

const random = Chance(2)

const randomId = () =>
  random.integer({
    min: 1,
    max: 1311,
  })

export const fakeUser = <
  T extends Partial<Insertable<User>>,
>(
  overrides: T = {} as T
): Insertable<User> => ({
  email: random.email(),
  password: 'Password.1312!',
  name: random.name(),
  allergies: random.word(),
  diet: random.pickone([
    'vegan',
    'vege',
    'diary-free',
    'gluten-free',
  ]),
  profilePicture: random.url(),
  ...overrides,
})

export const fakeAuthUser = <
  T extends Partial<AuthUser>,
>(
  overrides: T = {} as T
): AuthUser => ({
  id: randomId(),
  email: random.email(),
  ...overrides,
})

export const fakeHousehold = <
  T extends Partial<Insertable<Household>>,
>(
  overrides: T = {} as T
): Insertable<Household> => ({
  name: random.name(),
  profilePicture: random.url(),
  ...overrides,
})

export const fakeAuthHousehold = <
  T extends Partial<AuthHousehold>,
>(
  overrides: T = {} as T
): AuthHousehold => ({
  id: randomId(),
  ...overrides,
})

export const fakeIngredient = <
  T extends Partial<Insertable<Ingredient>>,
>(
  overrides: T = {} as T
): Insertable<Ingredient> => ({
  name: random.word({ length: 5 }),
  type: random.word({ length: 5 }),
  quantity: random.integer({ min: 0, max: 1000 }),
  unit: random.pickone(['grams', 'unit', 'ml']),
  purchaseDate: random.date(),
  expiryDate: random.date(),
  householdId: randomId(),
  storage: random.pickone([
    'fridge',
    'freezer',
    'dry storage',
  ]),
  notifInterval: random.integer({
    min: 1,
    max: 20,
  }),
  nextNotif: random.date(),
  isReady: random.bool(),
  note: random.paragraph(),
  ...overrides,
})

export const fakeRecipe = <
  T extends Partial<Insertable<Recipe>>,
>(
  overrides: T = {} as T
): Insertable<Recipe> => ({
  name: random.word({ length: 5 }),
  description: random.paragraph({ sentences: 3 }),
  tips: random.paragraph({ sentences: 2 }),
  portions: random.integer({ min: 1, max: 1000 }),
  prepTime: random.integer({ min: 5, max: 120 }),
  img: random.domain(),
  vid: random.domain(),
  householdId: randomId(),
  ...overrides,
})

export const fakeOutsideMeal = <
  T extends Partial<Insertable<Meal>>,
>(
  overrides: T = {} as T
): Insertable<Meal> => ({
  portions: random.integer({ min: 1, max: 6 }),
  outsideMeal: random.word(),
  eatingDate: random.date(),
  householdId: randomId(),
  ...overrides,
})

export const fakeHomeMeal = <
  T extends Partial<Insertable<Meal>>,
>(
  overrides: T = {} as T
): Insertable<Meal> => ({
  portions: random.integer({ min: 1, max: 6 }),
  recipeId: randomId(),
  eatingDate: random.date(),
  householdId: randomId(),
  ...overrides,
})

export const fakeMember = <
  T extends Partial<Insertable<Member>>,
>(
  overrides: T = {} as T
) => ({
  userId: randomId(),
  householdId: randomId(),
  roleId: random.integer({ min: 1, max: 3 }),
  ...overrides,
})

export const fakeRcpIngr = <
  T extends Partial<Insertable<RcpIngr>>,
>(
  overrides: T = {} as T
) => ({
  recipeId: randomId(),
  ingredientId: randomId(),
  householdId: randomId(),
  amount: random.integer({ min: 0, max: 1000 }),
  unit: random.pickone(['grams', 'unit', 'ml']),
  ...overrides,
})

export const fakeParticipant = <
  T extends Partial<Insertable<Participant>>,
>(
  overrides: T = {} as T
) => ({
  userId: randomId(),
  mealId: randomId(),
  confirmation: random.bool(),
  attended: random.bool(),
  ...overrides,
})

export const fakeLeftover = <
  T extends Partial<Insertable<Leftover>>,
>(
  overrides: T = {} as T
) => ({
  mealId: randomId(),
  portions: random.integer({ min: 1, max: 20 }),
  expiryDate: random.date(),
  householdId: randomId(),
  ...overrides,
})

export const closeExpiryDate = (): Date => {
  const today = new Date()
  today.setDate(
    today.getDate() +
      random.integer({ min: 1, max: 3 })
  )
  return today
}

export const longExpiryDate = (): Date => {
  const today = new Date()
  today.setDate(
    today.getDate() +
      random.integer({ min: 4, max: 10 })
  )
  return today
}

export const someDaysAgo = (): Date => {
  const today = new Date()
  today.setDate(
    today.getDate() -
      random.integer({ min: 1, max: 3 })
  )
  return today
}

export const aWeekAgo = (): Date => {
  const today = new Date()
  today.setDate(
    today.getDate() -
      random.integer({ min: 4, max: 10 })
  )
  return today
}
