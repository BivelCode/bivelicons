/**
 * SVG Optimization Script (incremental)
 *
 * Optimizes only new or modified SVG source files for every registered
 * style using SVGO. Skips files whose optimized version is already up
 * to date, drastically reducing build time after the first run.
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

// Extended SVGO configuration – adds shape conversion & group cleanup
const optimizeConfig = {
  ...svgoConfig,
  plugins: [
    ...svgoConfig.plugins,
    { name: 'convertShapeToPath', params: { convertArcs: true } },
    'collapseGroups',
  ],
};

// Canonical SVG structure
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

async function run() {
  console.log('⚙️  Optimizing SVGs (incremental)…\n');

  let totalSkipped = 0;
  let totalOptimized = 0;

  for (const style of styles) {
    const sourceDir = srcDir(style.id);
    const destDir = optimizedDir(style.id);

    if (!fs.existsSync(sourceDir)) {
      console.warn(`  ⚠ Source directory not found: ${sourceDir}`);
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });

    const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.svg'));
    console.log(`  ${style.id}: ${files.length} SVG files total`);

    let styleOptimized = 0;
    let styleSkipped = 0;

    for (const file of files) {
      const srcPath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);

      const srcStat = fs.statSync(srcPath);
      // Check if destination exists and is newer or same age
      if (fs.existsSync(destPath)) {
        const destStat = fs.statSync(destPath);
        if (destStat.mtimeMs >= srcStat.mtimeMs) {
          // Already up to date → skip
          styleSkipped++;
          continue;
        }
      }

      // Needs optimization
      const raw = fs.readFileSync(srcPath, 'utf8');
      try {
        const result = await svgo.optimize(raw, {
          ...optimizeConfig,
          path: srcPath,
        });
        const normalized = normalizeSvg(result.data);
        fs.writeFileSync(destPath, normalized, 'utf8');
        styleOptimized++;
        console.log(`    ✔ ${file} optimized`);
      } catch (err) {
        console.error(
          `    ✗ Error optimizing ${style.id}/${file}: ${err.message}`
        );
        process.exit(1);
      }
    }

    console.log(
      `    → ${styleOptimized} optimized, ${styleSkipped} skipped (up to date)\n`
    );
    totalOptimized += styleOptimized;
    totalSkipped += styleSkipped;
  }

  console.log(
    `✅ SVG optimization complete – ${totalOptimized} optimized, ${totalSkipped} skipped.`
  );
}

run().catch((err) => {
  console.error('❌ SVG optimization failed:', err);
  process.exit(1);
});
