export const AUTH_CONFIG = {
  GRAPHQL_URL: "https://db.subspace.money/v1/graphql",
  DEFAULT_COUNTRY_CODE: "+91",
  // For testing only
  TOKEN_REFRESH_INTERVAL: 23 * 60 * 60 * 1000,
  TOKEN_EXPIRY_BUFFER: 60 * 60 * 1000,
  ROUTES: {
    LOGIN: "/login",
    DASHBOARD: "/dashboard",
    ROOT: "/",
  },
  OTP_LENGTH: 6,
  PHONE_REGEX: /^\+91[6-9]\d{9}$/,
  MEDIA_UPLOAD_URL:
    import.meta.env.VITE_NODE_ENV === "production"
      ? "https://campaign.vocallabs.ai/upload"
      : "http://localhost:3030/upload",
} as const;
