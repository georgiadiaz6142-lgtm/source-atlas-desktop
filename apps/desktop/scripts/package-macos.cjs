const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { packager } = require('@electron/packager');
const packageJson = require('../package.json');

const desktopRoot = path.resolve(__dirname, '..');
const architecture = process.arch === 'arm64' ? 'arm64' : 'x64';

async function main() {
  const rendererEntry = path.join(desktopRoot, 'dist', 'index.html');
  const rendererHtml = fs.readFileSync(rendererEntry, 'utf8');
  if (/\b(?:src|href)="\/(?!\/)/.test(rendererHtml)) {
    throw new Error('生产页面仍包含绝对资源路径，Electron file:// 模式会出现黑屏');
  }

  const appPaths = await packager({
    dir: desktopRoot,
    name: '知源星图',
    platform: 'darwin',
    arch: architecture,
    out: path.join(desktopRoot, 'release'),
    overwrite: true,
    asar: true,
    prune: true,
    icon: path.join(desktopRoot, 'build', 'source-atlas.icns'),
    appBundleId: 'com.song.sourceatlas',
    appCategoryType: 'public.app-category.productivity',
    appVersion: packageJson.version,
    buildVersion: packageJson.version,
    appCopyright: 'Copyright © 2026 Song',
    extendInfo: {
      CFBundleDevelopmentRegion: 'zh_CN',
      CFBundleLocalizations: ['zh_CN', 'en'],
      NSHighResolutionCapable: true,
    },
    ignore: [
      /^\/release(?:\/|$)/,
      /^\/src(?:\/|$)/,
      /^\/build\/source-atlas\.iconset(?:\/|$)/,
      /^\/build\/source-atlas-icon-draft.*\.png$/,
      /^\/electron\/.*\.test\.cjs$/,
    ],
  });

  for (const appPath of appPaths) {
    const bundlePath = path.join(appPath, '知源星图.app');
    execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', bundlePath], { stdio: 'inherit' });
    console.log(`已生成应用：${appPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
