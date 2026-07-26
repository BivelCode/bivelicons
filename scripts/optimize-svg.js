/**
 * SVG Optimization Script
 *
 * Optimizes all SVG source files for every registered style using SVGO.
 * Extends the base SVGO configuration with shape-to-path conversion and
 * group collapsing, then normalizes each SVG to a canonical structure
 * before writing it to packages/webfonts/optimized/<style>.
 */

const fs = require('fs');
const path = require('path');
const svgo = require('svgo');
const styles = require('../configs/styles.config');
const svgoConfig = require('../configs/svgo/svgo.config');
const { srcDir, optimizedDir } = require('../configs/utils/paths');

// ------------------------------------------------------------------
// Extended SVGO configuration – adds shape conversion & group cleanup
// ------------------------------------------------------------------
const optimizeConfig = {
  ...svgoConfig,
  plugins: [
    ...svgoConfig.plugins,
    { name: 'convertShapeToPath', params: { convertArcs: true } },
    'collapseGroups',
  ],
};

// ------------------------------------------------------------------
// Canonical SVG structure
// ------------------------------------------------------------------
const XML_DECL = '<?xml version="1.0" encoding="UTF-8"?>';

function normalizeSvg(svgString) {
  const body = svgString
    .replace(/^<\?xml[^?]*\?>\s*/i, '')
    .replace(/^(<!--[\s\S]*?-->\s*)+/i, '');

  const vbMatch = body.match(/\bviewBox="([^"]*)"/);
  const viewBox = vbMatch ? vbMatch[1] : '0 0 24 24';

  const normalized = body.replace(
    /<svg[^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="${viewBox}">`
  );

  return `${XML_DECL}${normalized}`;
}

// ------------------------------------------------------------------
// Main optimisation routine
// ------------------------------------------------------------------
async function run() {
  console.log('⚙️  Optimizing SVGs with SVGO…\n');

  for (const style of styles) {
    const sourceDir = srcDir(style.id);
    const destDir = optimizedDir(style.id);

    console.log(`  Processing style: ${style.id}`);
    console.log(`    Source: ${sourceDir}`);
    console.log(`    Dest:   ${destDir}`);

    if (!fs.existsSync(sourceDir)) {
      console.warn(`  ⚠ Source directory not found, skipping.`);
      continue;
    }

    // Create destination (recursive)
    fs.mkdirSync(destDir, { recursive: true });

    const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.svg'));
    console.log(`    Found ${files.length} SVG files`);

    let optimizedCount = 0;
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');

      try {
        const result = await svgo.optimize(raw, {
          ...optimizeConfig,
          path: filePath,
        });
        const normalized = normalizeSvg(result.data);
        const outPath = path.join(destDir, file);
        fs.writeFileSync(outPath, normalized, 'utf8');
        optimizedCount++;
        console.log(`    ✔ ${file} optimized`);
      } catch (err) {
        console.error(
          `    ✗ Error optimizing ${style.id}/${file}: ${err.message}`
        );
        process.exit(1);
      }
    }

    console.log(
      `  ${style.id}: ${optimizedCount} icons written to ${destDir}\n`
    );
  }

  console.log('✅ SVG optimization complete.');
}

run().catch((err) => {
  console.error('❌ SVG optimization failed:', err);
  process.exit(1);
});
