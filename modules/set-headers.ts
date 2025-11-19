import { ZuploContext, ZuploRequest, environment } from "@zuplo/runtime";
import { getUserData } from "../utils/auth-utils";

/**
 * Sets secret key, client ID, and profile headers.
 * This policy extracts profile information from API key metadata or JWT token and adds it to request headers
 * so the backend can identify the authenticated user/profile.
 *
 * Headers set:
 * - X-Spectora-Profile-ID: The profile signed ID
 * - X-Spectora-Profile-Type: The profile type (e.g., "Inspector")
 * - X-Zuplo-Secret-Key: The secret key for the API to authenticate the request
 * - X-Client-ID: The client ID extracted from the JWT token (only for JWT authentication)
 */
export default async function (request: ZuploRequest, context: ZuploContext) {
  const secret_key: string | undefined = environment.SECRET_KEY;
  const userData = getUserData(request);

  if (!secret_key) {
    context.log.error("Secret key is not set");

    return new Response(
      JSON.stringify({
        code: "SECRET_KEY_NOT_SET",
        message: "Secret key is not set",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const profile_id = userData.spectora_profile_id;
  const profile_type = userData.spectora_profile_type;
  const client_id = userData.client_id;

  if (profile_id && profile_type) {
    context.log.info(`Profile ID: ${profile_id}`);
    context.log.info(`Profile Type: ${profile_type}`);
    context.log.info(`Client ID: ${client_id}`);

    request.headers.set("X-Spectora-Profile-ID", profile_id);
    request.headers.set("X-Spectora-Profile-Type", profile_type);
    request.headers.set("X-Zuplo-Secret-Key", secret_key);

    if (client_id) {
      request.headers.set("X-Client-ID", client_id);
    }

    return request;
  }

  return new Response(
    JSON.stringify({
      code: "INVALID_CREDENTIALS",
      message:
        "Invalid API key metadata. Missing required profile information.",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
