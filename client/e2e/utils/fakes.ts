import { Chance } from 'chance'
import { Insertable } from 'kysely'
import type { User } from '@server/shared/types.js'

export const random = process.env.CI ? Chance() : Chance()

export const fakeUser = <T extends Insertable<User>>(overrides: Partial<T> = {} as T) => ({
  email: random.email(),
  password: 'NTM.1312',
  name: random.first(),
  allergies: random.word(),
  diet: random.pickone(['vegan', 'vege', 'diary-free', 'gluten-free']),
  profilePicture: random.url(),
  ...overrides,
})

export const fakeHousehold = <T extends Insertable<User>>(overrides: Partial<T> = {} as T) => ({
  name: random.first(),
  profilePicture: random.url(),
  ...overrides,
})
