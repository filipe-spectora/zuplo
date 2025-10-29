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
    scopes: ["openid", "profile", "email", "zuplo_api_keys_create"],
  },
  apiKeys: {
    enabled: true,
    createKey: async ({ apiKey, auth }) => {
      const serverUrl = process.env.ZUDOKU_PUBLIC_ISSUER;
      const accessToken = (auth as any).providerData?.accessToken;

      console.log("------> SERVER URL:", serverUrl);
      console.log("------> ACCESS TOKEN:", accessToken);

      if (!serverUrl) {
        throw new Error("ZUDOKU_PUBLIC_ISSUER is not set");
      }

      if (!accessToken) {
        throw new Error("Access token is not set");
      }

      const createApiKeyRequest = new Request(
        `${serverUrl}/api/v2/zuplo/api_keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            data: {
              attributes: {
                description: apiKey.description,
                expires_at: apiKey.expiresOn,
              },
            },
          }),
        }
      );

      const response = await fetch(createApiKeyRequest);

      if (!response.ok) {
        throw new Error(`Failed to create API key: ${response.statusText}`);
      }

      const responseData = await response.json();

      console.log("------> RESPONSE:", responseData);

      return responseData;
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
