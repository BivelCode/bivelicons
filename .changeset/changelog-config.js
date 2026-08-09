/**
 * Custom changelog configuration for Bivelcode Icons.
 *
 * Features:
 *   - Per-package changelogs filtered by [package-name] prefix
 *   - Consolidated root CHANGELOG.md with all changes
 *   - Automatic package detection from packages/ directory
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

// ------------------------------------------------------------------
// 1. Helpers
// ------------------------------------------------------------------

/**
 * Parse a changeset summary to extract target packages and message.
 * Format: "[package1, package2] Actual message here"
 * If no prefix, the change applies to all packages ("*").
 */
function parseSummary(summary) {
  const firstLine = summary.split('\n')[0].trim();
  const prefixRegex = /^\[([^\]]+)\]\s*(.+)$/;
  const match = firstLine.match(prefixRegex);

  if (match) {
    const packageNames = match[1]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const cleanMessage = match[2];
    const restLines = summary
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');
    const fullMessage = restLines
      ? `${cleanMessage}\n${restLines}`
      : cleanMessage;
    return { packages: packageNames, message: fullMessage };
  }

  return { packages: ['*'], message: summary };
}

/**
 * Get all available package names from the packages/ directory.
 */
function getAllPackageNames() {
  if (!fs.existsSync(PACKAGES_DIR)) return [];
  return fs.readdirSync(PACKAGES_DIR).filter((name) => {
    const pkgPath = path.join(PACKAGES_DIR, name, 'package.json');
    return fs.existsSync(pkgPath);
  });
}

/**
 * Read a package's CHANGELOG.md or return a fresh template.
 */
function readPackageChangelog(packageName) {
  const changelogPath = path.join(PACKAGES_DIR, packageName, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    return fs.readFileSync(changelogPath, 'utf8');
  }
  return getBaseTemplate(packageName);
}

/**
 * Base template for a new package changelog.
 */
function getBaseTemplate(packageName) {
  return `# Changelog — @bivelcode/${packageName}

All notable changes to this package will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
`;
}

/**
 * Write changelog for a specific package.
 */
function writePackageChangelog(packageName, content) {
  const changelogPath = path.join(PACKAGES_DIR, packageName, 'CHANGELOG.md');
  fs.mkdirSync(path.dirname(changelogPath), { recursive: true });
  fs.writeFileSync(changelogPath, content, 'utf8');
}

/**
 * Insert a new entry into the [Unreleased] section of a changelog.
 * Creates the appropriate ### section (Added, Changed, etc.) if missing.
 */
function insertUnreleasedEntry(changelog, type, message) {
  const lines = changelog.split('\n');
  const unreleasedIndex = lines.findIndex((line) =>
    line.startsWith('## [Unreleased]')
  );

  if (unreleasedIndex === -1) return changelog;

  // Find the end of the [Unreleased] section (next version header or EOF)
  const nextVersionIndex = lines.findIndex(
    (line, i) => i > unreleasedIndex && line.startsWith('## [')
  );
  const sectionEnd = nextVersionIndex === -1 ? lines.length : nextVersionIndex;

  // Look for existing section header within [Unreleased]
  const sectionHeader = `### ${type}`;
  let sectionIndex = -1;
  for (let i = unreleasedIndex + 1; i < sectionEnd; i++) {
    if (lines[i] === sectionHeader) {
      sectionIndex = i;
      break;
    }
  }

  if (sectionIndex !== -1) {
    // Section exists — find where to insert the new entry
    let insertAt = sectionIndex + 1;
    while (insertAt < sectionEnd && lines[insertAt].startsWith('- ')) {
      insertAt++;
    }
    lines.splice(insertAt, 0, `- ${message}`);
  } else {
    // Section doesn't exist — add it before the next section or at the end
    const newSection = ['', sectionHeader, `- ${message}`];
    lines.splice(sectionEnd, 0, ...newSection);
  }

  return lines.join('\n');
}

// ------------------------------------------------------------------
// 2. Changesets API (called by @changesets/cli during release)
// ------------------------------------------------------------------

/**
 * Called for each changeset to generate the line for the root CHANGELOG.md.
 * Also updates per-package changelogs with the filtered message.
 */
async function getReleaseLine(changeset, type) {
  const { packages: targetPackages, message } = parseSummary(changeset.summary);
  const allPackages = getAllPackageNames();
  const affectedPackages = targetPackages.includes('*')
    ? allPackages
    : targetPackages;

  // Update each affected package's changelog
  for (const pkgName of affectedPackages) {
    if (!allPackages.includes(pkgName)) {
      console.warn(
        `  ⚠ Package "${pkgName}" not found in packages/ — skipping.`
      );
      continue;
    }
    const pkgChangelog = readPackageChangelog(pkgName);
    const updated = insertUnreleasedEntry(pkgChangelog, type, message);
    writePackageChangelog(pkgName, updated);
    console.log(`  📝 Updated packages/${pkgName}/CHANGELOG.md`);
  }

  // Return the line for the root CHANGELOG.md (with package tags)
  const pkgTag =
    affectedPackages.length === allPackages.length
      ? '[*]'
      : `[${affectedPackages.join(', ')}]`;
  return `- ${pkgTag} ${message}`;
}

async function getDependencyReleaseLine() {
  return '';
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
