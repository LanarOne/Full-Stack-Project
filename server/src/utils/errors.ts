import { NoResultError } from 'kysely'
import { TRPCError } from '@trpc/server'
import { ZodError } from 'zod'

export function handleKyselyErrors(
  error: unknown
): never {
  if (!(error instanceof Error)) {
    throw error
  }

  if (
    error instanceof NoResultError ||
    error.message.includes('no result')
  ) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message:
        'No matching record found in the database',
    })
  }

  if ((error as any).code) {
    switch ((error as any).code) {
      case '23503':
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'No matching record found in the database',
        })
      case '23502':
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Some required field must be missing',
        })
      case '42703':
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Some input was not expected to be found in the database',
        })
      case '22008':
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Some date input was malformed',
        })

      case '22P02':
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Some input was not formatted as expected',
        })
      case '23514':
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Some input was not formatted as expected',
        })
      case '23505':
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Record already exists in the database',
        })
      case '42601':
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'No matching record found in the database',
        })
      default:
        throw error
    }
  }

  if (error instanceof ZodError) {
    throw error
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected server error occurred.',
    cause: error,
  })
}
