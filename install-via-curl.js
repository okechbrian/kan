#!/usr/bin/env node
/**
 * install-via-curl.js - Downloads npm packages via curl.exe (bypasses OpenSSL proxy issue)
 */
const { execSync } = require('child_process');
const { readFileSync, mkdirSync, existsSync, rmSync, statSync } = require('fs');
const path = require('path');

const PROXY = 'http://10.154.90.195:8080';
const REGISTRY = 'https://registry.npmjs.org';
const PROJECT_DIR = __dirname;
const NM_DIR = path.join(PROJECT_DIR, 'node_modules');
const TMP_DIR = path.join(PROJECT_DIR, '.npm-tmp');

function log(msg) { console.log(`[install] ${msg}`); }
function err(msg) { console.error(`[ERROR] ${msg}`); }

function curlFetch(url) {
  const tmpFile = path.join(TMP_DIR, 'manifest-tmp.json');
  execSync(
    `curl.exe -s --proxy "${PROXY}" --max-time 60 -o "${tmpFile}" "${url}"`,
    { stdio: 'pipe', windowsHide: true }
  );
  const data = readFileSync(tmpFile, 'utf8');
  return JSON.parse(data);
}

function curlDownload(url, dest) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execSync(
        `curl.exe -s -L --proxy "${PROXY}" --max-time 600 -o "${dest}" "${url}"`,
        { stdio: 'pipe', windowsHide: true }
      );
      const size = statSync(dest).size;
      if (size > 0) return size;
    } catch {}
    // Retry after delay
    if (attempt < 3) {
      log(`  Retry ${attempt}/3...`);
      try { execSync('timeout /t 2 >nul', { stdio: 'pipe', windowsHide: true }); } catch {}
    }
  }
  return 0;
}

function extractTarball(tgzPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  execSync(
    `tar -xzf "${tgzPath}" -C "${destDir}" --strip-components=1`,
    { stdio: 'pipe', windowsHide: true }
  );
}

function resolvePackage(name, range) {
  const encoded = name.replace('/', '%2f');
  const clean = (range || 'latest').replace('^', '').replace('~', '').replace('>=', '');
  
  try {
    // For exact versions, fetch the version-specific manifest directly (small!)
    if (/^\d+\.\d+\.\d+/.test(clean)) {
      const vd = curlFetch(`${REGISTRY}/${encoded}/${clean}`);
      if (vd && vd.dist && vd.dist.tarball) {
        return {
          name: vd.name,
          version: vd.version,
          tarball: vd.dist.tarball,
          integrity: vd.dist.integrity,
          dependencies: vd.dependencies || {}
        };
      }
    }
  } catch (e) {
    // Fall through to full manifest fetch
  }
  
  try {
    // Fetch full manifest for range resolution
    const manifest = curlFetch(`${REGISTRY}/${encoded}`);
    const versions = Object.keys(manifest.versions || {});
    if (!versions.length) return null;

    let target = versions.find(v => v === clean);
    if (!target) {
      const parts = clean.split('.');
      if (parts.length >= 2) {
        const prefix = `${parts[0]}.${parts[1]}`;
        const candidates = versions.filter(v => v.startsWith(prefix + '.'));
        target = candidates.sort((a, b) => {
          const av = a.split('.').map(Number);
          const bv = b.split('.').map(Number);
          for (let i = 0; i < 3; i++) {
            if ((av[i] || 0) !== (bv[i] || 0)) return (av[i] || 0) - (bv[i] || 0);
          }
          return 0;
        }).pop();
      }
    }
    if (!target && versions.length) target = versions[versions.length - 1];
    if (!target) return null;

    const vd = manifest.versions[target];
    if (!vd || !vd.dist || !vd.dist.tarball) return null;

    return {
      name: vd.name,
      version: vd.version,
      tarball: vd.dist.tarball,
      integrity: vd.dist.integrity,
      dependencies: vd.dependencies || {}
    };
  } catch (e) {
    err(`Resolve failed for ${name}@${range}: ${e.message}`);
    return null;
  }
}

const visited = new Set();

async function installPkg(name, range, parentDir) {
  const pkgDir = path.join(parentDir, 'node_modules', name.replace('/', path.sep));
  const key = `${name}@${range}`;
  if (visited.has(key)) return;
  visited.add(key);

  // Check if already installed
  const existingPkg = path.join(pkgDir, 'package.json');
  if (existsSync(existingPkg)) {
    const childPkg = JSON.parse(readFileSync(existingPkg, 'utf8'));
    for (const [dep, depRange] of Object.entries(childPkg.dependencies || {})) {
      const depDir = path.join(parentDir, 'node_modules', dep.replace('/', path.sep), 'package.json');
      if (!existsSync(depDir)) {
        await installPkg(dep, depRange, parentDir);
      }
    }
    return;
  }

  log(`Resolving ${key}...`);
  const resolved = resolvePackage(name, range);
  if (!resolved) {
    err(`Could not resolve ${key}`);
    return;
  }

  const tgzName = `${resolved.name.replace('/', '-')}-${resolved.version}.tgz`;
  const tgzPath = path.join(TMP_DIR, tgzName);

  if (!existsSync(tgzPath)) {
    log(`Downloading ${resolved.name}@${resolved.version}...`);
    const size = curlDownload(resolved.tarball, tgzPath);
    if (size === 0) {
      err(`Failed to download ${resolved.name}@${resolved.version}`);
      return;
    }
    log(`  Downloaded ${Math.round(size / 1024)}KB`);
  }

  log(`Extracting ${resolved.name}@${resolved.version}...`);
  try {
    extractTarball(tgzPath, pkgDir);
  } catch (e) {
    err(`Failed to extract ${resolved.name}: ${e.message}`);
    return;
  }

  // Install sub-dependencies
  for (const [dep, depRange] of Object.entries(resolved.dependencies)) {
    await installPkg(dep, depRange, pkgDir);
  }
}

async function main() {
  log('=== Curl-based npm installer ===');

  mkdirSync(TMP_DIR, { recursive: true });

  if (existsSync(NM_DIR)) {
    log('Cleaning node_modules...');
    try { rmSync(NM_DIR, { recursive: true, force: true }); } catch {}
  }

  const pkg = JSON.parse(readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8'));

  log('\n--- dependencies ---');
  for (const [name, range] of Object.entries(pkg.dependencies || {})) {
    await installPkg(name, range, PROJECT_DIR);
  }

  log('\n--- devDependencies ---');
  for (const [name, range] of Object.entries(pkg.devDependencies || {})) {
    await installPkg(name, range, PROJECT_DIR);
  }

  log('\nCleaning up temp files...');
  try { rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}

  log('\n=== Done! ===');
  log('Run "npm install --prefer-offline" to verify and fix any missing links.');
}

main().catch(e => { err(`Fatal: ${e.message}`); process.exit(1); });
