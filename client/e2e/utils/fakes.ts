import { Chance } from 'chance'
import { Insertable } from 'kysely'
import type {Household, Ingredient, User } from '@server/shared/types.js'

export const random = process.env.CI ? Chance() : Chance()
const randomId = () =>
  random.integer({
    min: 1,
    max: 1311,
  })

export const fakeUser = <T extends Insertable<User>>(overrides: Partial<T> = {} as T) => ({
  email: random.email(),
  password: 'NTM.1312',
  name: random.first(),
  allergies: random.word(),
  diet: random.pickone(['vegan', 'vege', 'diary-free', 'gluten-free']),
  profilePicture: random.url(),
  ...overrides,
})

export const fakeHousehold = <T extends Insertable<Household>>(overrides: Partial<T> = {} as T) => ({
  name: random.first(),
  profilePicture: random.url(),
  ...overrides,
})

export const fakeIngredient = <T extends Insertable<Ingredient>>(overrides: Partial<T> = {} as T) => ({
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
