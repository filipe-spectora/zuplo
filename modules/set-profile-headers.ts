import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

/**
 * Sets profile headers for API key authentication.
 * This policy extracts profile information from API key metadata and adds it to request headers
 * so the backend can identify the authenticated user/profile.
 *
 * For JWT authentication, this policy skips header setting because the backend
 * will extract profile information directly from the JWT token.
 *
 * Headers set for API key requests:
 * - X-Spectora-Profile-ID: The profile ID from API key metadata
 * - X-Spectora-Profile-Type: The profile type from API key metadata (e.g., "Inspector")
 */
export default async function (request: ZuploRequest, context: ZuploContext) {
  const { data: userData } = request?.user ?? {};

  // Check if authenticated via JWT
  // JWT tokens have 'iss' (issuer) or 'jti' (JWT ID) claims
  if (userData.iss || userData.jti) {
    context.log.info(
      "JWT authentication detected - backend will extract profile from token"
    );
    // For JWT authentication, the backend will decode the token and extract profile info
    // No need to set headers here
    return request;
  }

  // API Key authentication - extract metadata and set headers
  context.log.info(
    "API Key authentication detected - extracting profile from metadata"
  );

  const profile_id = userData.spectora_profile_id;
  const profile_type = userData.spectora_profile_type;

  context.log.info(`Profile ID: ${profile_id}`);
  context.log.info(`Profile Type: ${profile_type}`);

  // Validate required fields for API key authentication
  if (profile_id && profile_type) {
    request.headers.set("X-Spectora-Profile-ID", profile_id);
    request.headers.set("X-Spectora-Profile-Type", profile_type);
    return request;
  }

  return new Response(
    JSON.stringify({
      code: "INVALID_CREDENTIALS",
      message: "Invalid API key metadata. Missing required profile information."
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" }
    }
  );
}
