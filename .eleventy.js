module.exports = function(eleventyConfig) {
  eleventyConfig.setTemplateFormats([
    "md",
    "html",
    "css",
    "njk"
  ]);

  eleventyConfig.addFilter("readableDate", dateObj => dateObj.toLocaleDateString());
};
