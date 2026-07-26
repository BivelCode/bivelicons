/**
 * Cross-platform path utilities.
 *
 * Provides helpers that normalise file-system paths to POSIX format
 * (forward slashes only). This is required by tools that rely on glob
 * patterns internally (e.g. Fantasticon), because backslashes on Windows
 * are interpreted as escape characters rather than directory separators.
 */

const path = require('path');

/**
 * Normalise a path and convert every backslash to a forward slash.
 *
 * On Linux / macOS this is essentially a no-op (paths already use `/`).
 * On Windows it turns `D:\Projects\foo\bar` into `D:/Projects/foo/bar`.
 *
 * @param {string} inputPath - The file-system path to normalise.
 * @returns {string} The path with all `\` replaced by `/`.
 */
function normalizePath(inputPath) {
  return path.normalize(inputPath).split(path.sep).join('/');
}

/**
 * Join path segments and return the result in POSIX format.
 *
 * Equivalent to `path.join(...segments)` followed by `normalizePath()`.
 *
 * @param {...string} segments - Path segments to join.
 * @returns {string} The joined path with forward slashes only.
 */
function joinPosix(...segments) {
  return normalizePath(path.join(...segments));
}

/**
 * Patch the glob instance resolved by Fantasticon to normalise backslashes
 * to forward slashes before any glob call. Required on Windows because
 * Fantasticon builds its glob pattern with path.join(), which produces
 * backslashes that glob cannot match against.
 *
 * Must be called **before** requiring Fantasticon, otherwise the patch
 * has no effect.
 *
 * Under pnpm each package resolves its own copy of glob, so we explicitly
 * resolve glob from Fantasticon's directory to get the correct isolated
 * instance.
 */
function patchFantasticonGlob() {
  const fantasticonDir = path.dirname(require.resolve('fantasticon'));
  const globPath = require.resolve('glob', { paths: [fantasticonDir] });
  const globModule = require(globPath);
  const origGlob = globModule.glob;
  globModule.glob = (pattern, opts) =>
    origGlob(pattern.replace(/\\/g, '/'), opts);
}

module.exports = { normalizePath, joinPosix, patchFantasticonGlob };
