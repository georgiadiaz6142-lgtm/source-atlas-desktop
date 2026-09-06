const fs = require('node:fs');
const path = require('node:path');
const png2icons = require('png2icons');

const desktopRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(desktopRoot, 'build', 'source-atlas-icon.png');
const outputPath = path.join(desktopRoot, 'build', 'source-atlas.icns');

if (!fs.existsSync(sourcePath)) {
  throw new Error(`找不到图标源文件：${sourcePath}`);
}

const source = fs.readFileSync(sourcePath);
const icns = png2icons.createICNS(source, png2icons.BICUBIC, 0);
if (!icns) throw new Error('无法生成 macOS ICNS 图标');

fs.writeFileSync(outputPath, icns);
console.log(`已生成 macOS 图标：${outputPath}`);
