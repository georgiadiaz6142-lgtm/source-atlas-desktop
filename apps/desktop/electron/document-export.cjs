const JSZip = require('jszip');
const path = require('node:path');

function escapeXml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)));
}

function htmlToParagraphs(html) {
  const paragraphs = [];
  let runs = [];
  let boldDepth = 0;
  let italicDepth = 0;

  const finishParagraph = () => {
    if (runs.length || !paragraphs.length) paragraphs.push(runs);
    runs = [];
  };
  const appendText = (value) => {
    const decoded = decodeHtml(value);
    const lines = decoded.replace(/\r/g, '').split('\n');
    lines.forEach((line, index) => {
      if (line) runs.push({ text: line, bold: boldDepth > 0, italic: italicDepth > 0 });
      if (index < lines.length - 1) finishParagraph();
    });
  };

  for (const token of String(html || '').match(/<[^>]+>|[^<]+/g) || []) {
    if (!token.startsWith('<')) { appendText(token); continue; }
    const match = token.match(/^<\s*(\/?)\s*([a-z0-9]+)/i);
    if (!match) continue;
    const closing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    if (tag === 'br') { finishParagraph(); continue; }
    if (['div', 'p'].includes(tag)) {
      if (!closing && runs.length) finishParagraph();
      if (closing && runs.length) finishParagraph();
      continue;
    }
    if (tag === 'li') {
      if (!closing) {
        if (runs.length) finishParagraph();
        runs.push({ text: '• ', bold: false, italic: false });
      } else if (runs.length) finishParagraph();
      continue;
    }
    if (['b', 'strong'].includes(tag)) boldDepth = Math.max(0, boldDepth + (closing ? -1 : 1));
    if (['i', 'em'].includes(tag)) italicDepth = Math.max(0, italicDepth + (closing ? -1 : 1));
  }
  if (runs.length) finishParagraph();
  return paragraphs.length ? paragraphs : [[]];
}

function paragraphXml(runs) {
  const content = runs.map((run) => {
    const properties = `${run.bold ? '<w:b/>' : ''}${run.italic ? '<w:i/>' : ''}`;
    return `<w:r>${properties ? `<w:rPr>${properties}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(run.text)}</w:t></w:r>`;
  }).join('');
  return `<w:p>${content}</w:p>`;
}

function safeExportName(title, type) {
  const extension = type === 'word' ? '.docx' : '.txt';
  const candidate = path.basename(String(title || '').trim()).replace(/[\\/:*?"<>|]/g, '-');
  const existingExtension = path.extname(candidate);
  const stem = path.basename(candidate, existingExtension).trim() || '未命名文档';
  return `${stem}${extension}`;
}

async function createDocxBuffer(title, html) {
  const zip = new JSZip();
  const paragraphs = htmlToParagraphs(html).map(paragraphXml).join('');
  const now = new Date().toISOString();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);
  zip.folder('word').file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="PingFang SC"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`);
  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  zip.folder('docProps').file('core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(title)}</dc:title><dc:creator>知源星图</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
  zip.folder('docProps').file('app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>知源星图</Application></Properties>`);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

module.exports = { createDocxBuffer, htmlToParagraphs, safeExportName };
