module.exports = function(eleventyConfig) {
  eleventyConfig.setTemplateFormats([
    "md",
    "html",
    "css", // css is not yet a recognized template extension in Eleventy
    "njk"
  ]);

  eleventyConfig.addFilter("readableDate", dateObj => dateObj.toLocaleDateString());
};
