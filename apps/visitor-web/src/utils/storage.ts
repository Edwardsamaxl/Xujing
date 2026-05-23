const VISITOR_KEY = 'xujing_visitor_id'
const COMPLETED_KEY = 'xujing_completed_spots'
const INTEREST_KEY = 'xujing_interest_tags'
const CURRENT_TARGET_KEY = 'xujing_current_target'
const UNLOCKED_NARRATIVES_KEY = 'xujing_unlocked_narratives'

export function getVisitorId(): string | null {
  return localStorage.getItem(VISITOR_KEY)
}

export function setVisitorId(id: string) {
  localStorage.setItem(VISITOR_KEY, id)
}

export function getCompletedSpots(): string[] {
  const raw = localStorage.getItem(COMPLETED_KEY)
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addCompletedSpot(spotId: string) {
  const spots = getCompletedSpots()
  if (!spots.includes(spotId)) {
    spots.push(spotId)
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(spots))
  }
}

export function isSpotCompleted(spotId: string): boolean {
  return getCompletedSpots().includes(spotId)
}

export function getInterestTag(): string {
  const raw = localStorage.getItem(INTEREST_KEY)
  try {
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed[0] || '历史' : '历史'
  } catch {
    return '历史'
  }
}

export function setInterestTag(tag: string) {
  localStorage.setItem(INTEREST_KEY, JSON.stringify([tag]))
}

export function getCurrentTarget(): string | null {
  return localStorage.getItem(CURRENT_TARGET_KEY)
}

export function setCurrentTarget(spotId: string | null) {
  if (spotId) localStorage.setItem(CURRENT_TARGET_KEY, spotId)
  else localStorage.removeItem(CURRENT_TARGET_KEY)
}

export function getUnlockedNarratives(): string[] {
  const raw = localStorage.getItem(UNLOCKED_NARRATIVES_KEY)
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function unlockNarrative(spotId: string) {
  const unlocked = getUnlockedNarratives()
  if (!unlocked.includes(spotId)) {
    unlocked.push(spotId)
    localStorage.setItem(UNLOCKED_NARRATIVES_KEY, JSON.stringify(unlocked))
  }
}

export function isNarrativeUnlocked(spotId: string): boolean {
  return getUnlockedNarratives().includes(spotId)
}

export function clearVisitor() {
  localStorage.removeItem(VISITOR_KEY)
  localStorage.removeItem(COMPLETED_KEY)
  localStorage.removeItem(INTEREST_KEY)
  localStorage.removeItem(CURRENT_TARGET_KEY)
  localStorage.removeItem(UNLOCKED_NARRATIVES_KEY)
}
