import type { MetadataRoute } from "next";

/* Word-of-mouth community: the site is reached by a link from a friend,
   never through a search engine. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
