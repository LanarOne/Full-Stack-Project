import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import cors from 'cors'
import { renderTrpcPanel } from 'trpc-panel'
import config from './config'
import type { Context } from './trpc'
import { appRouter } from './controllers'
import type { Database } from './database'

export default function createApp(db: Database) {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use('/api/health', (_, res) => {
    res.status(200).send('OK')
  })

  app.use(
    '/api/v1/trpc',
    createExpressMiddleware({
      createContext: ({
        req,
        res,
      }: CreateExpressContextOptions): Context => ({
        db,
        req,
        res,
      }),

      router: appRouter,
    })
  )

  if (config.env === 'development') {
    app.use('/api/v1/trcp-panel', (_, res) => {
      res.send(
        renderTrpcPanel(appRouter, {
          url: `http://localhost:${config.port}/api/v1/trpc`,
          transformer: 'superjson',
        })
      )
    })
  }
  return app
}
