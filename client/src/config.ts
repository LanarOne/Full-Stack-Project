// export const apiOrigin = (import.meta.env.VITE_API_ORIGIN as string) || 'http://localhost:3000'
export const apiPath = (import.meta.env.VITE_API_PATH as string) || '/api/v1/trpc'
export const apiBase = apiPath

if (typeof apiPath !== 'string') {
  throw new Error('VITE_API_PATH is not defined')
}
