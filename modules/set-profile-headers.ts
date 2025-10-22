import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function (request: ZuploRequest, context: ZuploContext) {
  const profile_id = request.user.data["spectora_profile_id"];
  const profile_type = request.user.data["spectora_profile_type"];

  context.log.info(`Profile ID: ${profile_id}`);
  context.log.info(`Profile Type: ${profile_type}`);

  if (profile_id && profile_type) {
    request.headers.set("X-Spectora-Profile-ID", profile_id)
    request.headers.set("X-Spectora-Profile-Type", profile_type)

    return request;
  }

  return new Response("Invalid API key metadata. Please contact admin.", { status: 400 });
}