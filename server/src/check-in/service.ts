import {
  createCheckIn,
  getCheckInsByVisitor,
  getVisitorById,
  updateVisitorCurrentSpot,
  markRewardIssued,
} from '../data'

export async function checkIn(visitorId: string, spotId: string) {
  const record = await createCheckIn(visitorId, spotId, 'button')

  await updateVisitorCurrentSpot(visitorId, spotId)

  const visitor = await getVisitorById(visitorId)
  const checkIns = await getCheckInsByVisitor(visitorId)
  const completedSpotIds = new Set(checkIns.map(c => c.spotId))

  // 只统计目的地（cold spots）是否全部打卡
  const targetSpots = visitor?.campaign.spots.filter(s => s.type === 'cold') || []
  const allCompleted = targetSpots.every(s => completedSpotIds.has(s.id))

  if (allCompleted && visitor) {
    await markRewardIssued(visitorId)
  }

  return {
    success: true,
    checkInId: record.id,
    rewardUnlocked: allCompleted,
    completed: allCompleted,
  }
}
