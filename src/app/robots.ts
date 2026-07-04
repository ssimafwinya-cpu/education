import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The app itself is per-user and behind local/session state — keep
        // crawlers on the marketing surface.
        disallow: ["/app/", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
