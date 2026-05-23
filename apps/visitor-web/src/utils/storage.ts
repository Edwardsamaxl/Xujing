const VISITOR_KEY = 'xujing_visitor_id'
const COMPLETED_KEY = 'xujing_completed_spots'
const FACTION_KEY = 'xujing_faction'
const STYLE_KEY = 'xujing_style'
const ROUTE_MODE_KEY = 'xujing_route_mode'
const CURRENT_SPOT_KEY = 'xujing_current_spot'

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

export function getFaction(): string | null {
  return localStorage.getItem(FACTION_KEY)
}

export function setFaction(faction: string) {
  localStorage.setItem(FACTION_KEY, faction)
}

export function getStyle(): string | null {
  return localStorage.getItem(STYLE_KEY)
}

export function setStyle(style: string) {
  localStorage.setItem(STYLE_KEY, style)
}

export type RouteMode = 'archaeology' | 'full' | 'express'

const DEFAULT_ROUTE_MODE: RouteMode = 'archaeology'

export function getRouteMode(): RouteMode {
  const raw = localStorage.getItem(ROUTE_MODE_KEY)
  if (raw === 'archaeology' || raw === 'full' || raw === 'express') return raw
  return DEFAULT_ROUTE_MODE
}

export function setRouteMode(mode: RouteMode) {
  localStorage.setItem(ROUTE_MODE_KEY, mode)
}

export function getCurrentSpot(): string | null {
  return localStorage.getItem(CURRENT_SPOT_KEY)
}

export function setCurrentSpot(spotId: string | null) {
  if (spotId) localStorage.setItem(CURRENT_SPOT_KEY, spotId)
  else localStorage.removeItem(CURRENT_SPOT_KEY)
}

export function getRemainingSpots(routeSpotIds: string[]): string[] {
  const completed = getCompletedSpots()
  const set = new Set(completed)
  return routeSpotIds.filter((id) => !set.has(id))
}

export function clearVisitor() {
  localStorage.removeItem(VISITOR_KEY)
  localStorage.removeItem(COMPLETED_KEY)
  localStorage.removeItem(FACTION_KEY)
  localStorage.removeItem(STYLE_KEY)
  localStorage.removeItem(ROUTE_MODE_KEY)
  localStorage.removeItem(CURRENT_SPOT_KEY)
}
