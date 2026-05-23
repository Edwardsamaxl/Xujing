import { getVisitorById, getCheckInsByVisitor } from '../data'

export async function getReward(visitorId: string) {
  const visitor = await getVisitorById(visitorId)

  if (!visitor || !visitor.rewardIssued) {
    return null
  }

  const checkIns = await getCheckInsByVisitor(visitorId)
  const taskIndex = checkIns.length > 0 ? checkIns.length - 1 : 0
  const totalTasks = visitor.campaign.spots.filter(s => s.type === 'cold').length

  const reward = visitor.campaign.rewards[0]
  if (!reward) return null

  return {
    name: reward.name,
    unlockText: reward.unlockText,
    imageUrl: reward.imageUrl,
    taskIndex,
    totalTasks,
  }
}
