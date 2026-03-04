import type { MemberRepo } from '@server/repositories/memberRepo.js'

export async function isMember({
  userId,
  householdId,
  memberRepo,
}: {
  userId: number
  householdId: number
  memberRepo: MemberRepo
}) {
  const member = await memberRepo
    .findOne({ userId, householdId })
    .catch(() => null)

  return member
}
