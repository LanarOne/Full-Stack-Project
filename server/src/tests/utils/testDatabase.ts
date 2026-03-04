import { createDatabase } from '@server/database/index.js'
import config from '@server/config.js'

export const createTestDatabase = () =>
  createDatabase(config.database)
