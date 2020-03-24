const syntaxHighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  eleventyConfig.setTemplateFormats(["md", "html", "css", "njk"]);

  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addFilter("readableDate", dateObj =>
    dateObj.toLocaleDateString()
  );

  eleventyConfig.addPlugin(syntaxHighlightPlugin);
};
