import { createTRPCProxyClient, httpBatchLink, TRPCClientError } from '@trpc/client'
import { AppRouter } from '@server/controllers/index.js'
import SuperJSON from 'superjson'
import { apiOrigin, apiPath } from './config.js'
import { expect, Page } from '@playwright/test'
import { fakeUser } from './fakes.js'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: SuperJSON,
      url: `${apiOrigin}${apiPath}`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
    }),
  ],
})

type UserLogin = Parameters<typeof trpc.user.signup.mutate>[0]
type UserLoginAuthed = UserLogin & { id: number }

export async function createUser(userLogin: UserLogin = fakeUser()): Promise<UserLoginAuthed> {
  try {
    const signupResponse = await trpc.user.signup.mutate(userLogin)
    return { ...userLogin, id: signupResponse.id }
  } catch (error: unknown) {
    if (!(error instanceof TRPCClientError) || error?.data?.code !== 'BAD_REQUEST') throw error
    return { ...userLogin, id: -1 }
  }
}

export async function signupNewUser(
  page: Page,
  userLogin: UserLogin = fakeUser(),
): Promise<UserLoginAuthed> {
  let userId: number
  try {
    const signupResponse = await trpc.user.signup.mutate(userLogin)
    userId = signupResponse.id
  } catch (error: unknown) {
    if (!(error instanceof TRPCClientError) || error?.data?.code !== 'BAD_REQUEST') throw error

    userId = -1
  }

  await page.goto('/login')
  await expect(page).toHaveURL(`/login`)
  await page.getByLabel('Email').fill(userLogin.email)
  await page.getByLabel('Password').fill(userLogin.password)
  await page.getByRole('button', { name: 'Login' }).click()

  await page.waitForURL('/')

  return { ...userLogin, id: userId }
}

export async function asUser<T>(
  page: Page,
  userLogin: UserLogin,
  callback: (user: UserLoginAuthed) => Promise<T>,
): Promise<T> {
  const user = await signupNewUser(page, userLogin)

  if (page.url() === 'about:blank') {
    await page.goto('/')
    await page.waitForURL('/login')
  }

  const callbackResult = await callback(user)

  await page.goto('/')

  return callbackResult
}

export async function createHousehold(page: Page, householdName: string) {
  await page.goto('/household/create')

  await page.getByTestId('householdName').fill(householdName)
  await page.getByTestId('createBtn').click()
}
