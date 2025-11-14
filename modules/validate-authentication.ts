import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

/**
 * Validates that at least one authentication method succeeded.
 * This policy should run after both api-key-inbound and open-id-jwt-auth-inbound policies.
 *
 * Authentication methods supported:
 * - API Key: Authenticated via api-key-inbound policy
 * - JWT Token: Authenticated via open-id-jwt-auth-inbound policy
 *
 * If neither authentication method succeeded, returns 401 Unauthorized.
 */
export default async function (request: ZuploRequest, context: ZuploContext) {
  const { data: userData } = request?.user ?? {};

  // Check if at least one authentication method succeeded
  if (!userData || Object.keys(userData).length === 0) {
    context.log.warn("No authentication method provided");
    return new Response(
      JSON.stringify({
        code: "UNAUTHORIZED",
        message: "Authentication required. Please provide either an API key or JWT token."
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  context.log.info("Authentication validated successfully");
  return request;
}
