/**
 * Central style registry for Bivelcode Icons.
 *
 * Each style has its own folder, CSS prefix, font name,
 * and a reserved Unicode block to guarantee no overlap
 * between styles.
 */

const path = require('path');
const { srcDir, fontsDir, cssDir } = require('./utils/paths');

/**
 * Unicode Private Use Area  allocation:
 */
const UNICODE_START = {
  'solid-rounded': 0xe000, // Démarre à U+E000
  brands: 0xf400, // Démarre à U+E000
};

/**
 * List of all icon styles supported by the library.
 * Each entry must contain:
 *   - id:          kebab-case identifier (matches the folder name)
 *   - prefix:      CSS class prefix, e.g. "bi-sr" for solid-rounded
 *   - fontName:    font-family name used in the generated fonts
 *   - inputDir:    absolute path to the directory containing the SVG sources
 *   - unicodeStart:starting codepoint in the reserved Unicode block
 */
const styles = [
  {
    id: 'solid-rounded',
    prefix: 'bi-sr',
    fontName: 'bivelicons-solid-rounded',
    inputDir: srcDir('solid-rounded'),
    unicodeStart: UNICODE_START['solid-rounded'],
  },
  {
    id: 'brands',
    prefix: 'bi-br',
    fontName: 'bivelicons-brands',
    inputDir: srcDir('brands'),
    unicodeStart: UNICODE_START['brands'],
  },
];

module.exports = styles;
