import type { ZudokuConfig } from "zudoku";

/**
 * Developer Portal Configuration
 * For more information, see:
 * https://zuplo.com/docs/dev-portal/zudoku/configuration/overview
 */
const config: ZudokuConfig = {
  site: {
    title: "My Developer Portal",
    logo: {
      src: {
        light: "https://cdn.zuplo.com/assets/my-dev-portal-light.svg",
        dark: "https://cdn.zuplo.com/assets/my-dev-portal-dark.svg",
      },
    },
  },
  metadata: {
    title: "Developer Portal",
    description: "Developer Portal",
  },
  navigation: [
    {
      type: "category",
      label: "Documentation",
      items: [
        {
          type: "category",
          label: "Getting Started",
          icon: "sparkles",
          items: [
            {
              type: "doc",
              file: "introduction",
            },
            {
              type: "doc",
              file: "markdown",
            },
          ],
        },
        {
          type: "category",
          label: "Useful Links",
          collapsible: false,
          icon: "link",
          items: [
            {
              type: "link",
              label: "Zuplo Docs",
              to: "https://zuplo.com/docs/dev-portal/introduction",
            },
            {
              type: "link",
              label: "Developer Portal Docs",
              to: "https://zuplo.com/docs/dev-portal/introduction",
            },
          ],
        },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "API Reference",
    },
  ],
  redirects: [{ from: "/", to: "/api" }],
  apis: [
    {
      type: "file",
      input: "../config/routes.oas.json",
      path: "api",
    },
  ],
  authentication: {
    type: "openid",
    clientId: process.env.ZUDOKU_PUBLIC_CLIENT_ID!,
    issuer: process.env.ZUDOKU_PUBLIC_ISSUER!,
    scopes: ["openid", "profile", "email"],
  },
  apiKeys: {
    enabled: true,
    createKey: async ({ apiKey, context, auth }) => {
      // Use the deployment URL from environment variable
      const deploymentName = process.env.ZUDOKU_PUBLIC_DEPLOYMENT_NAME;

      // process.env.ZUPLO_PUBLIC_SERVER_URL is only required for local development
      // import.meta.env.ZUPLO_SERVER_URL is automatically set when using a deployed environment, you do not need to set it
      const serverUrl =
        process.env.ZUPLO_PUBLIC_SERVER_URL ||
        import.meta.env.ZUPLO_SERVER_URL ||
        `https://${deploymentName}.zuplo.site`;

      // Get the JWT token from the auth provider data
      const jwtToken = (auth as any).providerData?.idToken;
      const accessToken = (auth as any).providerData?.accessToken;

      if (!jwtToken) {
        console.error("No JWT token available from auth provider", auth);
        throw new Error("Authentication token not found");
      }

      // Fetch additional user info from the userinfo endpoint to get additional data
      let spectora_profile_id = 0;
      let spectora_profile_type = 0;
      let spectora_company_id = 0;

      if (accessToken) {
        try {
          const userInfoResponse = await fetch(
            `${process.env.ZUDOKU_PUBLIC_ISSUER}/oauth/userinfo`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();

            spectora_profile_id = userInfo.profile_id;
            spectora_profile_type = userInfo.profile_type;
            spectora_company_id = userInfo.company_id;
          } else {
            console.warn(
              "Failed to fetch userinfo:",
              await userInfoResponse.text()
            );
          }
        } catch (error) {
          console.warn("Error fetching userinfo:", error);
          // Continue without profile metadata if fetch fails
        }
      }

      const createApiKeyRequest = new Request(
        serverUrl + "/v1/developer/api-key",
        {
          method: "POST",
          body: JSON.stringify({
            ...apiKey,
            email: auth.profile?.email,
            metadata: {
              spectora_profile_id,
              spectora_profile_type,
            },
            tags: {
              // Zuplo expects keys as camelCase
              spectoraCompanyId: spectora_company_id,
            },
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      // Don't use context.signRequest() as we need to pass the user's JWT token
      const createApiKey = await fetch(createApiKeyRequest);

      if (!createApiKey.ok) {
        const errorText = await createApiKey.text();
        console.error("Failed to create API key:", errorText);
        throw new Error("Could not create API Key");
      }

      // Return void as required by the type definition
      return;
    },
    getConsumers: async ({ context, auth }) => {
      console.log("--------> GET CONSUMERS (TO BE IMPLEMENTED", {
        context,
        auth,
      });

      return [];
    },
  },
};

export default config;
