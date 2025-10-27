import { ZuploContext, ZuploRequest, environment } from "@zuplo/runtime";

// These environment variables need to be set in the Zuplo dashboard
const accountName = environment.ZP_ACCOUNT_NAME;
const bucketName = environment.ZP_API_KEY_SERVICE_BUCKET_NAME;

export default async function (request: ZuploRequest, context: ZuploContext) {
  // Extract user information from the authenticated request
  const sub = request.user?.sub;
  const userEmail = request.user?.data?.email || request.user?.email;
  const userName = request.user?.data?.name || request.user?.name;

  console.log("-------------> USER:", JSON.stringify(request.user));

  if (!sub) {
    return new Response(JSON.stringify({ error: "User not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the request body
  const body = await request.json();

  // Validate required environment variables
  if (!accountName || !bucketName || !environment.ZP_DEVELOPER_API_KEY) {
    context.log.error("Missing required environment variables", {
      accountName,
      bucketName,
      hasApiKey: !!environment.ZP_DEVELOPER_API_KEY,
    });

    return new Response(
      JSON.stringify({ error: "API key service not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Create a consumer with an API key using the Zuplo Management API
    const response = await fetch(
      `https://dev.zuplo.com/v1/accounts/${accountName}/key-buckets/${bucketName}/consumers?with-api-key=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${environment.ZP_DEVELOPER_API_KEY}`,
        },
        body: JSON.stringify({
          name: crypto.randomUUID(),
          managers: [
            {
              email: userEmail || "nobody@example.com",
              sub: sub,
            },
          ],
          description: body.description || "API Key",
          tags: {
            sub: sub,
            email: userEmail,
            name: userName,
            createdAt: new Date().toISOString(),
          },
          metadata: {
            ...body.metadata,
            userId: sub,
            email: userEmail,
            name: userName,
          },
          // Handle expiration if provided
          ...(body.expiresOn && { expiresOn: body.expiresOn }),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      context.log.error("Failed to create API key consumer", {
        status: response.status,
        error: errorText,
        sub,
        email: userEmail,
      });

      return new Response(
        JSON.stringify({
          error: "Failed to create API key",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the created consumer with API key
    const result = await response.json();

    context.log.info("API key created successfully", {
      consumerId: result.id,
      sub,
      email: userEmail,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    context.log.error("Error creating API key", {
      error: error.message,
      sub,
      email: userEmail,
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
