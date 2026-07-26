const path = require('path');
const paths = require('../utils/paths');
const { normalizePath } = require('../../scripts/utils/os-paths');

/**
 * Shared Fantasticon options applied to every style.
 *
 * - fontTypes: only WOFF2 and WOFF to keep the package light.
 * - fontsUrl:  relative path from the CSS file to the fonts directory.
 * - selector:  base CSS class required on every icon element.
 * - fontHeight: 1000 for sub-pixel precision.
 * - normalize: scale all glyphs to the same height.
 * - tag:        HTML element expected to carry the icon classes.
 */

const BASE_CONFIG = {
  fontTypes: ['woff2', 'woff'],
  assetTypes: ['css'],
  fontsUrl: '../fonts',
  selector: '.bc',
  fontHeight: 1000,
  normalize: true,
  templates: {
    css: path.join(__dirname, 'template.css.hbs'),
  },
};

/**
 * Build the complete Fantasticon configuration for a given icon style.
 *
 * Codepoints must be provided by the caller (the build script) after loading
 * them from the centralised Unicode registry. This guarantees that each icon
 * keeps the same Unicode codepoint forever.
 *
 * @param {object}  style      - Style descriptor from styles.config.js
 * @param {object}  codepoints - Map of icon name → unicode codepoint (decimal)
 * @returns {object} Fantasticon configuration object
 */

function getFantasticonConfig(style, codepoints) {
  const inputDir = normalizePath(paths.optimizedDir(style.id));

  return {
    ...BASE_CONFIG,
    inputDir,
    outputDir: paths.distPackageDir,
    name: style.fontName,
    prefix: style.prefix,
    codepoints,
    // pathOptions supprimé → tout sera généré directement dans distPackageDir
  };
}

module.exports = { getFantasticonConfig };
