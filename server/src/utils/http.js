export function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
}

export function validObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''))
}

export function validEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validPhone(value) {
  return typeof value === 'string' && /^[+0-9 ()-]{8,20}$/.test(value.trim())
}
