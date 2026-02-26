import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL || `https://${process.env.CLERK_DOMAIN}`,
      applicationID: "convex",
    },
  ]
} satisfies AuthConfig;