import type { MemberRepo } from '@server/repositories/memberRepo'

export async function isMember({
  userId,
  householdId,
  memberRepo,
}: {
  userId: number
  householdId: number
  memberRepo: MemberRepo
}) {
  return await memberRepo
    .findOne({ userId, householdId })
    .catch(() => null)
}
