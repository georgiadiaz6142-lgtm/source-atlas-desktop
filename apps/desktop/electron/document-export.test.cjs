const assert = require('node:assert/strict');
const test = require('node:test');
const JSZip = require('jszip');
const { createDocxBuffer, htmlToParagraphs, safeExportName } = require('./document-export.cjs');

test('normalizes exported document names and extensions', () => {
  assert.equal(safeExportName('方案/草稿.docx', 'word'), '草稿.docx');
  assert.equal(safeExportName('会议记录.docx', 'txt'), '会议记录.txt');
  assert.equal(safeExportName('', 'txt'), '未命名文档.txt');
});

test('converts basic canvas formatting into document runs', () => {
  assert.deepEqual(htmlToParagraphs('<div>第一段 <b>重点</b></div><div><i>第二段</i></div>'), [
    [{ text: '第一段 ', bold: false, italic: false }, { text: '重点', bold: true, italic: false }],
    [{ text: '第二段', bold: false, italic: true }],
  ]);
});

test('creates a readable OOXML Word package', async () => {
  const buffer = await createDocxBuffer('测试文档', '<div>你好 <b>世界</b></div>');
  const zip = await JSZip.loadAsync(buffer);
  assert.ok(zip.file('[Content_Types].xml'));
  assert.ok(zip.file('word/document.xml'));
  const documentXml = await zip.file('word/document.xml').async('string');
  assert.match(documentXml, /你好 /);
  assert.match(documentXml, /<w:b\/>/);
  assert.match(documentXml, /世界/);
});
