import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../server/src/shared/trpc.ts'
import SuperJSON from 'superjson'
import { apiBase } from '@/config.ts'
import { getStoredAccessToken } from '@/utils/auth.ts'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: apiBase,
      transformer: SuperJSON,
      headers: () => {
        const token = getStoredAccessToken(localStorage)

        if (!token) return {}

        return {
          Authorization: `Bearer ${token}`,
        }
      },
    }),
  ],
})
