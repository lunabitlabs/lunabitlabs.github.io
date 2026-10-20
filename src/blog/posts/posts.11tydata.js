// Every Markdown file in this folder is a blog post. Name it YYYY-MM-DD-title.md;
// the date comes from the name and the address is /blog/title/.
// A post with `draft: true` isn't published (see eleventy.config.js).
export default {
  layout: "layouts/post.njk",
  permalink: "/blog/{{ page.fileSlug }}/",
};
