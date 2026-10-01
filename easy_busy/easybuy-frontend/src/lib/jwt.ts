/** Claims written by users-service JwtService.generateAccessToken. */
export interface AccessTokenClaims {
  sub: string
  userId: string
  role: string
  type: string
  exp: number
  iat: number
}

/** Decodes (does not verify) a JWT payload. Verification is the gateway's job. */
export function decodeToken(token: string | null | undefined): AccessTokenClaims | null {
  if (!token) return null
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')))
  } catch {
    return null
  }
}

export const isExpired = (claims: AccessTokenClaims | null) => !claims || claims.exp * 1000 < Date.now()
