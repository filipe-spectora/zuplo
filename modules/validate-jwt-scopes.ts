import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

/**
 * Validates JWT token scopes for endpoints that require specific permissions.
 * This policy only applies to JWT authenticated requests and skips API key requests.
 *
 * Configuration:
 * Required scopes are defined per-route using OpenAPI extension data.
 * Add the following to your route in routes.oas.json:
 *
 * "x-required-scopes": ["inspections_index"]
 *
 * Example:
 * {
 *   "get": {
 *     "summary": "List Inspections",
 *     "x-required-scopes": ["inspections_index"],
 *     "x-zuplo-route": { ... }
 *   }
 * }
 */
export default async function (
  request: ZuploRequest,
  context: ZuploContext
) {
  // Get required scopes from route metadata
  const routeData = context.route.raw<{ "x-required-scopes"?: string[] }>();
  const requiredScopes = routeData["x-required-scopes"] || [];

  // Skip validation if no scopes are required for this route
  if (requiredScopes.length === 0) {
    context.log.info("No scope validation required for this route");
    return request;
  }

  const { data: userData } = request?.user ?? {};

  // Skip validation if not a JWT request
  // JWT tokens have 'iss' (issuer) or 'jti' (JWT ID) claims
  if (!userData.iss && !userData.jti) {
    context.log.info(
      "Skipping JWT scope validation - not a JWT request (API key authentication)"
    );

    return request;
  }

  context.log.info("JWT request detected - validating scopes");

  // Extract scopes from JWT token
  // Scopes are stored in the 'scope' claim as a space-separated string
  const scopeClaim = userData.scope || "";
  const userScopes = scopeClaim.split(" ").filter(Boolean);

  context.log.info(`User scopes: ${userScopes.join(", ")}`);
  context.log.info(`Required scopes: ${requiredScopes.join(", ")}`);

  // Check if user has all required scopes
  const missingScopes = requiredScopes.filter(
    (scope) => !userScopes.includes(scope)
  );

  if (missingScopes.length > 0) {
    context.log.warn(
      `Missing required scopes: ${missingScopes.join(", ")}`
    );

    return new Response(
      JSON.stringify({
        code: "UNAUTHORIZED",
        message: `JWT must have all the following scopes: ${requiredScopes.join(", ")}`,
        missing_scopes: missingScopes
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  context.log.info("JWT scope validation passed");
  
  return request;
}
