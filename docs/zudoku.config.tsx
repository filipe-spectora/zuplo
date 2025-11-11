import type { ZudokuConfig, ZudokuContext } from "zudoku";
import { ApiConsumer } from "zudoku/plugins/api-keys";

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
    scopes: [
      "openid",
      "profile",
      "email",
      "zuplo_api_keys_write",
      "zuplo_api_keys_read",
    ],
  },
  apiKeys: {
    enabled: true,
    // Reference: https://zuplo.com/docs/dev-portal/zudoku/guides/managing-api-keys-and-identities
    createKey: async ({ apiKey, context }): Promise<void> => {
      const serverUrl = getServerUrl();

      const createApiKeyRequest = await context.signRequest(
        new Request(`${serverUrl}/api/v2/zuplo/api_keys`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            data: {
              attributes: {
                description: apiKey.description,
                expires_at: apiKey.expiresOn,
              },
            },
          }),
        })
      );

      const response = await fetch(createApiKeyRequest);

      if (!response.ok) {
        throw new Error(`Failed to create API key: ${response.statusText}`);
      }

      const responseData = await response.json();

      console.log("------> RESPONSE:", responseData);
    },
    getConsumers: async (context: ZudokuContext): Promise<ApiConsumer[]> => {
      const serverUrl = getServerUrl();

      const request = await context.signRequest(
        new Request(`${serverUrl}/api/v2/zuplo/api_keys`)
      );

      const response = await fetch(request);
      const { data } = await response.json();

      return data;
    },
    rollKey: async (consumerId, context) => {
      console.log("------> ROLL KEY:", { consumerId, context });
    },
  },
};

const getServerUrl = (): string => {
  const serverUrl = process.env.ZUDOKU_PUBLIC_ISSUER;

  console.log("------> SERVER URL:", serverUrl);

  if (!serverUrl) {
    throw new Error("ZUDOKU_PUBLIC_ISSUER environment variable is not set");
  }

  return serverUrl;
};

export default config;
