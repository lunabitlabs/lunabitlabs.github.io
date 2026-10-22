import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  // Copied as they are, never run through a template engine.
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/**/img/**");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  // Miqat's page: its styles and sky script, and adhan-js (the prayer-time
  // library, MIT) straight from npm, so the version is pinned in package.json.
  eleventyConfig.addPassthroughCopy("src/miqat/assets");
  eleventyConfig.addPassthroughCopy("src/thaqib/assets");
  eleventyConfig.addPassthroughCopy("src/thaqib/img");
  eleventyConfig.addPassthroughCopy({ "node_modules/adhan/lib/bundles/adhan.umd.min.js": "miqat/assets/adhan.min.js" });
  eleventyConfig.addPassthroughCopy("src/site.webmanifest");

  // Tiqan's page keeps its own hand-made design (src/tiqan/index.njk); its
  // images sit beside it.
  eleventyConfig.addPassthroughCopy("src/tiqan/*.{jpg,png,svg}");

  // Blog posts: Markdown files in src/blog/posts. A post marked `draft: true`
  // is left out of the site entirely.
  eleventyConfig.addPreprocessor("drafts", "md", (data) => {
    if (data.draft) return false;
  });
  eleventyConfig.addCollection("posts", (collection) =>
    collection.getFilteredByGlob("src/blog/posts/*.md").reverse()
  );

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/blog/feed.xml",
    collection: { name: "posts", limit: 20 },
    metadata: {
      language: "en",
      title: "Lunabit Labs Blog",
      subtitle: "Notes from an independent app studio in Bahrain.",
      base: "https://lunabitlabs.com/",
      author: { name: "Lunabit Labs" },
    },
  });

  eleventyConfig.addFilter("readableDate", (date) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date)
  );
  eleventyConfig.addFilter("isoDate", (date) => date.toISOString().slice(0, 10));
  eleventyConfig.addFilter("appBySlug", (apps, slug) => apps.find((app) => app.slug === slug));
  // The home page lists "live" apps (on the App Store) apart from "soon" ones (in the lab).
  eleventyConfig.addFilter("byStatus", (apps, status) => apps.filter((app) => app.status === status));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
