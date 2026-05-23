const VISITOR_KEY = 'xujing_visitor_id'

export function getVisitorId(): string | null {
  return localStorage.getItem(VISITOR_KEY)
}

export function setVisitorId(id: string) {
  localStorage.setItem(VISITOR_KEY, id)
}

export function clearVisitor() {
  localStorage.removeItem(VISITOR_KEY)
}
