/**
 * Centralized paths for the Bivelcode Icons project.
 *
 * All paths are resolved relative to the project root.
 * This ensures consistency across all scripts and avoids
 * hardcoding directory structures.
 */

const path = require('path');

// Project root (two levels up from configs/utils/)
const ROOT = path.resolve(__dirname, '../../');

/**
 * Directory containing the original SVG icons, grouped by style.
 * @param {string} styleId - kebab-case style identifier (e.g. 'solid-rounded')
 */
function srcDir(styleId) {
  return path.join(ROOT, 'src', 'icons', styleId);
}

/**
 * Directory for optimized SVG files (intermediate build output).
 * @param {string} styleId
 */
function optimizedDir(styleId) {
  return path.join(ROOT, 'packages', 'optimized', styleId);
}

// Output paths for generated files
const fontsDir = path.join(ROOT, 'packages', 'webfonts', 'fonts');
const cssDir = path.join(ROOT, 'packages', 'webfonts', 'css');
const distPackageDir = path.join(ROOT, 'packages', 'webfonts');
const distMetadataDir = path.join(ROOT, 'packages', 'webfonts', 'metadata');

// Metadata directory (versioned, one JSON file per style)
const metadataDir = path.join(ROOT, 'metadata');

/**
 * Path to the metadata file for a given style.
 * @param {string} styleId
 * @returns {string} absolute path to metadata/<styleId>.json
 */
function styleMetadataPath(styleId) {
  return path.join(metadataDir, `${styleId}.json`);
}

// Configuration paths
const stylesConfigPath = path.join(ROOT, 'configs', 'styles.config.js');

module.exports = {
  ROOT,
  srcDir,
  optimizedDir,
  fontsDir,
  cssDir,
  distPackageDir,
  distMetadataDir,
  metadataDir,
  styleMetadataPath,
  stylesConfigPath,
};
