import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  // Copied as they are, never run through a template engine.
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/**/img/**");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Tiqan's page keeps its own hand-made design: every file in src/tiqan is
  // published exactly as written.
  eleventyConfig.addPassthroughCopy("src/tiqan");
  eleventyConfig.ignores.add("src/tiqan/**");

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

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
