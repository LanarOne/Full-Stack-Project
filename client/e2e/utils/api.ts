import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { AppRouter } from '@server/controllers/index.js'
import SuperJSON from 'superjson'
import { apiOrigin, apiPath } from './config.js'
import { Page } from '@playwright/test'
import { fakeUser } from './fakes.js'

let accessToken: string | null = null

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: SuperJSON,
      url: `${apiOrigin}${apiPath}`,

      headers: () => {
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      },
    }),
  ],
})

type UserLogin = Parameters<typeof trpc.user.signup.mutate>[0]
type UserLoginAuthed = UserLogin & { id: number; token: string }

export async function signupNewUser(
  page: Page,
  userLogin: UserLogin = fakeUser(),
): Promise<UserLoginAuthed> {
  try {
    await trpc.user.signup.mutate(userLogin)
  } catch (error) {
    // nothing to see here
    console.error(error)
  }

  const loginResponse = await trpc.user.login.mutate(userLogin)
  const userId = JSON.parse(atob(loginResponse.token.split('.')[1])).user.id

  return {
    ...userLogin,
    id: userId,
    token: loginResponse.token,
  }
}

export async function asUser<T>(
  page: Page,
  userLogin: UserLogin,
  callback: (user: UserLoginAuthed) => Promise<T>,
): Promise<T> {
  const user = await signupNewUser(page, userLogin)

  accessToken = user.token

  if (page.url() === 'about:blank') {
    await page.goto('/')
    await page.waitForURL('/login')
  }

  await page.evaluate(
    ({ accessToken }) => {
      localStorage.setItem('token', String(accessToken))
    },
    { accessToken },
  )

  const callbackResult = await callback(user)

  await page.evaluate(() => {
    localStorage.removeItem('token')
  })
  accessToken = null

  return callbackResult
}
