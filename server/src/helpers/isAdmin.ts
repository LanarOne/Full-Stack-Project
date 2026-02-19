import type { MemberRepo } from '@server/repositories/memberRepo'

export async function isAdmin({
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

  return admin?.roleId === 1
}
