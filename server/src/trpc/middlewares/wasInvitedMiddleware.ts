import { middleware } from '@server/trpc'
import { TRPCError } from '@trpc/server'

export const enforceWasInvited = middleware(
  async ({
    input,
    ctx: { authUser, repos },
    next,
  }) => {
    const { mealId } = input as { mealId: number }

    const result =
      await repos!.participantRepo!.findByMealId(
        mealId
      )
    const wasInvited = result.find(
      (el) => el.userId === authUser!.id
    )

    if (!wasInvited) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'You cannot access this information',
      })
    }
    return next()
  }
)
