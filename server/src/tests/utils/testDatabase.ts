import { createDatabase } from '@server/database'
import config from '@server/config'

export const createTestDatabase = () =>
  createDatabase(config.database)
