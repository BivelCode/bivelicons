const fs = require('fs');
const path = require('path');
const styles = require('../configs/styles.config');
const {
  getFantasticonConfig,
} = require('../configs/fantasticon/fantasticon.config');
const {
  optimizedDir,
  distPackageDir,
  cssDir,
  fontsDir,
  distMetadataDir,
  styleMetadataPath,
} = require('../configs/utils/paths');
const { normalizePath, patchFantasticonGlob } = require('./utils/os-paths');

// ------------------------------------------------------------------
// 1. Patch glob for Windows compatibility BEFORE requiring Fantasticon
// ------------------------------------------------------------------
patchFantasticonGlob();
const fantasticon = require('fantasticon');

// ------------------------------------------------------------------
// 2. Helpers
// ------------------------------------------------------------------

function loadCodepoints(styleId) {
  const filePath = styleMetadataPath(styleId);
  if (!fs.existsSync(filePath)) {
    console.error(
      `❌ Metadata file not found for style "${styleId}" – run assign-unicodes first.`
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// ------------------------------------------------------------------
// 3. Clean output directories (fonts + css only)
// ------------------------------------------------------------------
function cleanOutput() {
  console.log('🧹 Cleaning output directories…');
  cleanDir(fontsDir);
  cleanDir(cssDir);
  console.log('  Done.\n');
}

// ------------------------------------------------------------------
// 4. Generate fonts and CSS for one style
// ------------------------------------------------------------------
async function generateStyle(style) {
  const codepoints = loadCodepoints(style.id);
  const config = getFantasticonConfig(style, codepoints);

  console.log(`  Input directory: ${config.inputDir}`);
  if (!fs.existsSync(config.inputDir)) {
    console.error(`❌ Optimized SVG directory not found: ${config.inputDir}`);
    process.exit(1);
  }
  const svgFiles = fs
    .readdirSync(config.inputDir)
    .filter((f) => f.endsWith('.svg'));
  console.log(`  Found ${svgFiles.length} SVG files`);
  if (svgFiles.length === 0) {
    console.error(
      `❌ No SVG files in ${config.inputDir} – cannot generate fonts.`
    );
    process.exit(1);
  }

  // Ensure output directories exist
  fs.mkdirSync(fontsDir, { recursive: true });
  fs.mkdirSync(cssDir, { recursive: true });

  console.log(`  ${style.id}: generating webfonts and CSS…`);
  try {
    await fantasticon.generateFonts(config);
  } catch (err) {
    console.error(
      `❌ Fantasticon failed for style "${style.id}":`,
      err.message
    );
    process.exit(1);
  }

  // Fantasticon outputs files directly into distPackageDir (packages/webfonts/)
  // We move them to the appropriate subdirectories.
  const distRoot = distPackageDir;
  const cssSource = path.join(distRoot, `${style.fontName}.css`);
  const cssTarget = path.join(cssDir, `${style.fontName}.css`);
  const woff2Source = path.join(distRoot, `${style.fontName}.woff2`);
  const woffSource = path.join(distRoot, `${style.fontName}.woff`);

  // Move CSS
  if (fs.existsSync(cssSource)) {
    fs.renameSync(cssSource, cssTarget);
    console.log(`  CSS moved to css/${style.fontName}.css`);
  } else {
    console.error(
      `❌ CSS file not generated for style "${style.id}" (${cssSource})`
    );
    process.exit(1);
  }

  // Move fonts
  if (fs.existsSync(woff2Source)) {
    fs.renameSync(woff2Source, path.join(fontsDir, `${style.fontName}.woff2`));
  }
  if (fs.existsSync(woffSource)) {
    fs.renameSync(woffSource, path.join(fontsDir, `${style.fontName}.woff`));
  }

  console.log(`  ${style.id}: done.`);
}

// ------------------------------------------------------------------
// 5. Combine individual CSS files into bivelicons.css
// ------------------------------------------------------------------
function concatAllCSS() {
  const combinedPath = path.join(cssDir, 'bivelicons.css');
  const allCSS = styles
    .map((style) => {
      const cssFile = path.join(cssDir, `${style.fontName}.css`);
      if (!fs.existsSync(cssFile)) {
        console.error(`❌ CSS file missing: ${cssFile}`);
        process.exit(1);
      }
      return `/* ${style.id} */\n${fs.readFileSync(cssFile, 'utf8')}\n`;
    })
    .join('\n');

  fs.writeFileSync(combinedPath, allCSS, 'utf8');
  console.log('  Combined CSS → bivelicons.css');
}

// ------------------------------------------------------------------
// 6. Generate bivelicons.json metadata
// ------------------------------------------------------------------
function generateMetaJson() {
  const rootPkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  );
  const meta = {
    name: 'Bivel Icons',
    version: rootPkg.version,
    count: 0,
    icons: {},
  };

  for (const style of styles) {
    const codepoints = loadCodepoints(style.id);
    const styleIcons = [];

    for (const [iconName, codePoint] of Object.entries(codepoints)) {
      // Read the optimized SVG file
      const svgPath = path.join(optimizedDir(style.id), `${iconName}.svg`);
      let svgContent = '';
      if (fs.existsSync(svgPath)) {
        svgContent = fs.readFileSync(svgPath, 'utf8').replace(/\r?\n|\r/g, ' ');
      }

      const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
      const hexLower = hex.toLowerCase();

      styleIcons.push({
        name: iconName,
        class: `bc ${style.prefix}-${iconName}`,
        codePoint: codePoint,
        unicode: `U+${hex}`,
        css: `\\${hexLower}`,
        js: `\\u${hex}`,
        html: `&#x${hex};`,
        svg: svgContent,
      });
      meta.count++;
    }

    const displayName = style.id
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

    meta.icons[displayName] = styleIcons;
  }

  // Ensure the metadata output directory exists
  fs.mkdirSync(distMetadataDir, { recursive: true });
  fs.writeFileSync(
    path.join(distMetadataDir, 'bivelicons.json'),
    JSON.stringify(meta, null, 2) + '\n',
    'utf8'
  );
  console.log('  Metadata JSON generated → bivelicons.json');
}

// ------------------------------------------------------------------
// 7. Main
// ------------------------------------------------------------------
async function run() {
  console.log('🔨 Building webfonts…\n');

  cleanOutput();

  // Ensure the distribution root exists
  fs.mkdirSync(distPackageDir, { recursive: true });

  for (const style of styles) {
    await generateStyle(style);
  }

  concatAllCSS();
  generateMetaJson();

  console.log('\n✅ Fonts and CSS generated successfully in', distPackageDir);
}

run().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
