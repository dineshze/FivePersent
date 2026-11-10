import jwt from 'jsonwebtoken'

export function requireAuth(request, response, next) {
  const authorization = request.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ message: 'Please sign in to continue.' })
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (typeof payload !== 'object' || !payload.sub) {
      return response.status(401).json({ message: 'Your session is invalid. Please sign in again.' })
    }
    request.userId = payload.sub
    return next()
  } catch {
    return response.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}
