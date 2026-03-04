import type { MemberRepo } from '@server/repositories/memberRepo.js'

export async function isGuest({
  userId,
  householdId,
  memberRepo,
}: {
  userId: number
  householdId: number
  memberRepo: MemberRepo
}) {
  const admin = await memberRepo
    .findOne({ userId, householdId })
    .catch(() => null)

  return admin?.roleId === 3
}
