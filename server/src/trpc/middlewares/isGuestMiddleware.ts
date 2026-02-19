import { middleware } from '@server/trpc'
import { TRPCError } from '@trpc/server'
import { isGuest } from '@server/helpers/isGuest'

export const enforceIsGuest = middleware(
  async ({
    ctx: { authUser, authHousehold, repos },
    next,
  }) => {
    const isHouseholdGuest = await isGuest({
      userId: authUser!.id,
      householdId: authHousehold!.id,
      memberRepo: repos!.memberRepo!,
    })

    if (isHouseholdGuest) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          "You're only a guest in this household",
      })
    }

    return next()
  }
)
