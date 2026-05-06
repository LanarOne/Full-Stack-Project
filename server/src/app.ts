import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import cors from 'cors'
import { renderTrpcPanel } from 'trpc-panel'
import logger from '@server/logger.js'
import config from './config.js'
import type { Context } from './trpc/index.js'
import { appRouter } from './controllers/index.js'
import type { Database } from './database/index.js'

export default function createApp(db: Database) {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use('/api/health', (_, res) => {
    // basic SQL query to add
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

      onError({
        error,
        path,
        type,
        input,
        ctx,
        req,
      }) {
        logger.error(
          {
            err: error,
            path,
            type,
            input,
            userId: ctx?.authUser?.id,
            householdId: ctx?.authHousehold?.id,
            method: req.method,
            url: req.url,
          },
          'tRPC request failed'
        )
      },
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
