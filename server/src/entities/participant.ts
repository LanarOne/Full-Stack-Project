import { z } from 'zod'
import { idSchema } from '@server/entities/shared.js'
import type { Participant } from '@server/database/types.js'
import type { Selectable } from 'kysely'

export const participantSchema = z.object({
  mealId: idSchema,
  userId: idSchema,
  confirmation: z.nullable(z.boolean()),
  attended: z.boolean(),
})

export const participantKeysAll = Object.keys(
  participantSchema.shape
) as (keyof Participant)[]

export type ParticipantPublic = Pick<
  Selectable<Participant>,
  (typeof participantKeysAll)[number]
>
