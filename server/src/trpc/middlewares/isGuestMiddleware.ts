import { middleware } from '@server/trpc/index.js'
import { TRPCError } from '@trpc/server'
import { isGuest } from '@server/helpers/isGuest.js'

export const enforceIsGuest = middleware(
  async ({
    ctx: { authUser, authHousehold, repos },
    next,
  }) => {
    if (!authUser) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Please log in',
      })
    }
    if (!authHousehold) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No household context available',
      })
    }
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
