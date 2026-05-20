// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://borderpay.app";
const SANITY_PROJECT_ID = "ffacky71";
const SANITY_DATASET = "production";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/investors", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  const query = encodeURIComponent(
    `*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, publishedAt }`
  );
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = (await res.json()) as { result: Array<{ slug: string; publishedAt?: string }> };
    return (json.result || []).map((p) => ({
      path: `/blog/${p.slug}`,
      lastmod: p.publishedAt ? p.publishedAt.slice(0, 10) : undefined,
      changefreq: "monthly" as const,
      priority: "0.6",
    }));
  } catch (err) {
    console.warn("sitemap: failed to fetch blog posts", err);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const posts = await fetchBlogPosts();
const entries = [...staticEntries, ...posts];
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
