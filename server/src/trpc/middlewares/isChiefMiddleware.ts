import { middleware } from '@server/trpc/index.js'
import { TRPCError } from '@trpc/server'
import { isAdmin } from '@server/helpers/isAdmin.js'

export const enforceIsChief = middleware(
  async ({
    ctx: { authUser, authHousehold, repos },
    next,
  }) => {
    const isHouseholdChief = await isAdmin({
      userId: authUser!.id,
      householdId: authHousehold!.id,
      memberRepo: repos!.memberRepo!,
    })

    if (!isHouseholdChief) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          "You're not chief of this household",
      })
    }

    return next()
  }
)
