import { RequestUser, ZuploRequest } from "@zuplo/runtime";

/**
 * Gets the user data from the request.
 * Returns the user data object containing user claims and metadata.
 *
 * @param request - The Zuplo request object
 * @returns The user data object, or an empty object if no user data exists
 */
export function getUserData(request: ZuploRequest): any {
  return request?.user?.data ?? {};
}

/**
 * Checks if a request is authenticated via JWT token.
 * JWT tokens have 'iss' (issuer) or 'jti' (JWT ID) claims.
 *
 * @param request - The Zuplo request object
 * @returns true if the request is authenticated via JWT, false otherwise
 */
export function isJwtRequest(request: ZuploRequest): boolean {
  const user = getUserData(request);

  return !!(user.iss || user.jti);
}

/**
 * Checks if a request has valid authentication.
 * Authentication is valid if the user has a 'sub' (subject) claim,
 * which is present for both JWT tokens and API key authentication.
 *
 * @param request - The Zuplo request object
 * @returns true if the request is authenticated, false otherwise
 */
export function isAuthenticated(request: ZuploRequest): boolean {
  return !!request?.user?.sub;
}
