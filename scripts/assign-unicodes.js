/**
 * Unicode Allocation Script
 *
 * Scans the SVG source directories defined in styles.config.js,
 * validates file names, and assigns a permanent Unicode codepoint
 * to each icon. Codepoints are persisted in per‑style metadata
 * files under metadata/<style-id>.json.
 *
 * Existing codepoints are never changed. New icons receive the next
 * available codepoint inside the reserved block of their style.
 */

const fs = require('fs');
const path = require('path');
const styles = require('../configs/styles.config');
const {
  srcDir,
  styleMetadataPath,
  metadataDir,
} = require('../configs/utils/paths');

// ---------------------------------------------------------------------------
// 1. Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that an icon name follows lowercase-kebab-case.
 */
const VALID_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
function validateIconName(fileName, styleId) {
  const base = path.basename(fileName, '.svg');
  if (!VALID_NAME.test(base)) {
    console.error(
      `❌ Invalid icon name "${base}" in style "${styleId}". ` +
        `Icon names must be lowercase kebab-case (e.g. "arrow-right").`
    );
    process.exit(1);
  }
  return base;
}

/**
 * Load existing metadata for a style (if present).
 * @returns {object} Map of icon name → codepoint
 */
function loadExistingCodepoints(styleId) {
  const filePath = styleMetadataPath(styleId);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      console.error(
        `❌ Failed to parse metadata for style "${styleId}". Aborting.`
      );
      process.exit(1);
    }
  }
  return {};
}

/**
 * Save metadata for a style.
 */
function saveMetadata(styleId, data) {
  const filePath = styleMetadataPath(styleId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// 2. Process each style
// ---------------------------------------------------------------------------
let hasChanges = false;

for (const style of styles) {
  const dir = srcDir(style.id);

  if (!fs.existsSync(dir)) {
    console.warn(
      `⚠️  Source directory not found for style "${style.id}" – skipped.`
    );
    continue;
  }

  // Load existing codepoints for this style
  const codepoints = loadExistingCodepoints(style.id);
  const existingNames = new Set(Object.keys(codepoints));

  // Determine the next available codepoint
  const usedCodepoints = Object.values(codepoints);
  let nextCodepoint = style.unicodeStart;
  if (usedCodepoints.length > 0) {
    nextCodepoint = Math.max(...usedCodepoints) + 1;
  }

  // Scan SVG files
  const svgFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));

  // First pass: detect any name that is already in metadata but missing on disk
  // (optional warning)
  for (const name of existingNames) {
    if (!svgFiles.some((f) => path.basename(f, '.svg') === name)) {
      console.warn(
        `⚠️  Icon "${name}" exists in metadata but SVG is missing in style "${style.id}".`
      );
    }
  }

  // Second pass: assign codepoints to new icons
  for (const file of svgFiles) {
    const name = validateIconName(file, style.id);

    if (codepoints[name] !== undefined) {
      // Already assigned – keep existing codepoint
      continue;
    }

    // New icon
    if (nextCodepoint > style.unicodeStart + 9361) {
      console.error(
        `❌ Unicode block exhausted for style "${style.id}". ` +
          `Cannot assign a codepoint to "${name}".`
      );
      process.exit(1);
    }

    codepoints[name] = nextCodepoint;
    console.log(
      `✔  Assigned U+${nextCodepoint.toString(16).toUpperCase()} to "${style.id}/${name}"`
    );
    nextCodepoint++;
    hasChanges = true;
  }

  // Detect codepoint conflicts (same codepoint for different names)
  const seen = new Map();
  for (const [name, cp] of Object.entries(codepoints)) {
    if (seen.has(cp)) {
      console.error(
        `❌ Codepoint conflict in style "${style.id}": ` +
          `"${seen.get(cp)}" and "${name}" both have U+${cp.toString(16).toUpperCase()}.`
      );
      process.exit(1);
    }
    seen.set(cp, name);
  }

  // Save metadata for this style if changes were made
  if (hasChanges) {
    saveMetadata(style.id, codepoints);
  }
}

if (hasChanges) {
  console.log('✅ Metadata updated for changed styles.');
} else {
  console.log('✅ No new icons found – metadata unchanged.');
}
