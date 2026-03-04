import { middleware } from '@server/trpc/index.js'
import { isMember } from '@server/helpers/isMember.js'
import { TRPCError } from '@trpc/server'

export const enforceIsMember = middleware(
  async ({
    ctx: { authUser, authHousehold, repos },
    next,
  }) => {
    const isInHousehold = await isMember({
      userId: authUser!.id,
      householdId: authHousehold!.id,
      memberRepo: repos!.memberRepo!,
    })

    if (!isInHousehold) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          "You're not part of this household",
      })
    }

    return next()
  }
)
