import type {
  ExtractedDocument,
  ExtractedSection,
  ExtractedProjectBlock,
  ExtractedEducationBlock,
  LineBlock,
  DocumentType,
  DocumentQuality,
  DocumentClassification,
} from '../../types/resume';

export interface PDFTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL: boolean;
}

/**
 * Loads PDF.js dynamically from CDN if not present on window.
 */
async function getPdfJsLib(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        reject(new Error('PDF.js library failed to initialize on window.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js parser from CDN.'));
    document.head.appendChild(script);
  });
}

/**
 * Loads JSZip dynamically for DOCX XML extraction.
 */
async function getJSZipLib(): Promise<any> {
  if ((window as any).JSZip) {
    return (window as any).JSZip;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => {
      const jszip = (window as any).JSZip;
      if (jszip) resolve(jszip);
      else reject(new Error('JSZip failed to initialize on window.'));
    };
    script.onerror = () => reject(new Error('Failed to load JSZip from CDN.'));
    document.head.appendChild(script);
  });
}

// ─── 1. Contextual PDF Word-Boundary & Line Reconstruction ──────────────────

/**
 * Determines whether a space boundary is required between two adjacent text tokens
 * on the same line using contextual geometry, font metrics, and token semantics.
 */
export function shouldInsertWordSpace(prev: PDFTextItem, cur: PDFTextItem): boolean {
  const prevStr = prev.str;
  const curStr = cur.str;

  // 1. If either token already carries leading/trailing whitespace, no extra space needed
  if (/\s$/.test(prevStr) || /^\s/.test(curStr)) {
    return false;
  }

  const prevTrim = prevStr.trim();
  const curTrim = curStr.trim();
  if (!prevTrim || !curTrim) {
    return false;
  }

  // 2. Punctuation attachment rules (left-attaching punctuation never takes preceding space)
  // e.g. "model" + "." -> "model." | "skills" + ":" -> "skills:" | "CGPA" + ":" -> "CGPA:"
  if (/^[.,;:!?)\]}%]/.test(curTrim)) {
    return false;
  }

  // 3. Opening punctuation rules (right-attaching punctuation never takes following space)
  // e.g. "(" + "MPC" -> "(MPC" | "{" + "key" -> "{key" | "$" + "100" -> "$100"
  if (/^[([{<"']$/.test(prevTrim)) {
    return false;
  }

  // 4. Technical identifiers, URLs, emails, and hyphenated terms
  // e.g. "Scikit" + "-" + "learn" -> "Scikit-learn" | "user" + "@" + "gmail" -> "user@gmail"
  if (prevTrim.endsWith('@') || curTrim.startsWith('@')) return false;
  if (prevTrim.endsWith('/') || curTrim.startsWith('/')) return false;
  if (prevTrim.endsWith('\\') || curTrim.startsWith('\\')) return false;

  // Hyphens between alphanumeric terms
  if (prevTrim.endsWith('-') && !prevTrim.startsWith('•') && !prevTrim.startsWith('*')) {
    // Only connect if it's a word continuation, e.g. "end-" + "to-" + "end"
    if (/^[a-zA-Z0-9]/.test(curTrim)) return false;
  }
  if (curTrim.startsWith('-') && /^[a-zA-Z0-9]$/.test(prevTrim)) {
    return false;
  }

  // Plus signs in C++ or phone numbers
  if (prevTrim.endsWith('+') && curTrim.startsWith('+')) return false;
  if (prevTrim === '+' && /^\d+/.test(curTrim)) return false;

  // Dots in abbreviations, versions, decimals, domains: "B." + "Tech" -> "B.Tech" | "Node." + "js" -> "Node.js" | "8." + "57" -> "8.57"
  if (prevTrim.endsWith('.')) {
    if (/^(js|ts|py|cpp|ai|io|com|org|edu|in|gov|tech|net|html|css|json|sql|\d{1,4})/i.test(curTrim)) {
      return false;
    }
    // Single-letter abbreviation continuation: "B." + "Tech" or "A." + "P."
    if (/^[A-Z]\.$/.test(prevTrim) && /^[A-Z][a-zA-Z]*/.test(curTrim)) {
      return false;
    }
  }

  // 5. Contextual Spatial Gap Analysis
  const prevLen = prevTrim.length;
  const curLen = curTrim.length;

  const prevCharW = prevLen > 0 && prev.width > 0 ? prev.width / prevLen : (prev.height * 0.45 || 5.0);
  const curCharW = curLen > 0 && cur.width > 0 ? cur.width / curLen : (cur.height * 0.45 || 5.0);
  const avgCharW = Math.min(prevCharW, curCharW);

  const visualGap = cur.x - (prev.x + prev.width);

  // If there is a positive visual physical gap between the token bounding boxes (> 15% of character width)
  if (visualGap >= avgCharW * 0.15) {
    return true;
  }

  // Sub-character overlap / kerning boundary:
  // If the gap is slightly negative (-0.35 * avgCharW <= gap < 0.15 * avgCharW)
  // Check if both tokens are distinct semantic words (e.g. "Developed" and "a" in scaled PDF fonts)
  if (visualGap >= -avgCharW * 0.35) {
    // If prev is a complete word (length >= 2) and cur is a new word starting with letter or number
    if (/^[a-zA-Z0-9]/.test(curTrim) && /[a-zA-Z0-9]$/.test(prevTrim)) {
      // If prev is not a prefix fragment
      if (prevLen >= 2 || /^[aAI]$/.test(prevTrim)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Groups raw PDF items into line-level intermediate representations with layout geometry.
 */
export function reconstructLinesFromItems(items: PDFTextItem[], pageNumber = 1): LineBlock[] {
  if (items.length === 0) return [];

  // Group items by vertical baseline Y coordinate
  const lines: { y: number; height: number; items: PDFTextItem[] }[] = [];
  const sortedByYDesc = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  for (const item of sortedByYDesc) {
    const threshold = Math.max(item.height * 0.5, 3.5);
    const matchedLine = lines.find((line) => Math.abs(line.y - item.y) <= threshold);
    if (matchedLine) {
      matchedLine.items.push(item);
      matchedLine.height = Math.max(matchedLine.height, item.height);
    } else {
      lines.push({ y: item.y, height: item.height, items: [item] });
    }
  }

  const lineBlocks: LineBlock[] = [];
  let lineCounter = 1;

  for (const line of lines) {
    const sortedLineItems = line.items.sort((a, b) => a.x - b.x);
    let lineStr = '';
    const tokens: string[] = [];

    for (let i = 0; i < sortedLineItems.length; i++) {
      const cur = sortedLineItems[i];
      const prev = sortedLineItems[i - 1];

      if (prev) {
        if (shouldInsertWordSpace(prev, cur)) {
          lineStr += ' ';
        }
      }

      lineStr += cur.str;
      if (cur.str.trim()) {
        tokens.push(cur.str.trim());
      }
    }

    const trimmedText = lineStr.trim();
    if (trimmedText) {
      const minX = Math.min(...sortedLineItems.map((i) => i.x));
      const maxX = Math.max(...sortedLineItems.map((i) => i.x + (i.width || 0)));

      lineBlocks.push({
        lineNumber: lineCounter,
        lineIndex: lineCounter,
        pageNumber,
        columnIndex: 0,
        x: minX,
        y: line.y,
        width: Math.max(0, maxX - minX),
        height: line.height,
        text: trimmedText,
        tokens,
      });

      lineCounter++;
    }
  }

  return lineBlocks;
}

/**
 * Reconstructs natural page reading order with column-aware layout detection.
 */
function reconstructPageReadingOrder(
  items: PDFTextItem[],
  pageWidth: number,
  pageHeight: number,
  pageNumber: number,
  warnings: string[]
): { text: string; lineBlocks: LineBlock[] } {
  if (items.length === 0) return { text: '', lineBlocks: [] };

  const contentItems = items.filter((it) => it.str.trim().length > 0);
  if (contentItems.length < 5) {
    const singleBlocks = reconstructLinesFromItems(contentItems, pageNumber);
    return {
      text: singleBlocks.map((b) => b.text).join('\n'),
      lineBlocks: singleBlocks,
    };
  }

  const midX = pageWidth / 2;
  const leftXValues = contentItems.map((i) => i.x).filter((x) => x < midX - 30);
  const rightXValues = contentItems.map((i) => i.x).filter((x) => x > midX - 30);

  const isTwoColumn =
    leftXValues.length > 8 &&
    rightXValues.length > 8 &&
    leftXValues.length + rightXValues.length >= contentItems.length * 0.65;

  if (isTwoColumn) {
    const leftItems: PDFTextItem[] = [];
    const rightItems: PDFTextItem[] = [];
    const spanningItems: PDFTextItem[] = [];

    for (const item of contentItems) {
      const itemRight = item.x + item.width;
      if (item.x < midX - 40 && itemRight > midX + 40 && item.width > pageWidth * 0.5) {
        spanningItems.push(item);
      } else if (item.x < midX) {
        leftItems.push(item);
      } else {
        rightItems.push(item);
      }
    }

    if (Math.abs(leftItems.length - rightItems.length) > contentItems.length * 0.8) {
      warnings.push('Asymmetric two-column layout detected; column reading order resolved.');
    }

    const headerBlocks = reconstructLinesFromItems(spanningItems.filter((i) => i.y > pageHeight * 0.7), pageNumber);
    const leftBlocks = reconstructLinesFromItems(leftItems, pageNumber).map((b) => ({ ...b, columnIndex: 0 }));
    const rightBlocks = reconstructLinesFromItems(rightItems, pageNumber).map((b) => ({ ...b, columnIndex: 1 }));
    const footerBlocks = reconstructLinesFromItems(spanningItems.filter((i) => i.y <= pageHeight * 0.7), pageNumber);

    const allBlocks = [...headerBlocks, ...leftBlocks, ...rightBlocks, ...footerBlocks];
    allBlocks.forEach((b, idx) => {
      b.lineNumber = idx + 1;
      b.lineIndex = idx + 1;
    });

    const fullText = allBlocks.map((b) => b.text).join('\n');
    return { text: fullText, lineBlocks: allBlocks };
  }

  // Single-column layout
  const lineBlocks = reconstructLinesFromItems(contentItems, pageNumber);
  const fullText = lineBlocks.map((b) => b.text).join('\n');
  return { text: fullText, lineBlocks };
}

/**
 * Extracts full text and line blocks from PDF document.
 */
async function extractPDF(
  file: File,
  warnings: string[]
): Promise<{ rawText: string; pageCount: number; lineBlocks: LineBlock[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await getPdfJsLib();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  const pageCount = pdf.numPages;
  const allLineBlocks: LineBlock[] = [];
  let globalLineNumber = 1;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items: PDFTextItem[] = (textContent.items as any[]).map((it) => ({
      str: it.str || '',
      x: it.transform ? it.transform[4] : 0,
      y: it.transform ? it.transform[5] : 0,
      width: it.width || 0,
      height: it.height || 0,
      hasEOL: Boolean(it.hasEOL),
    }));

    const { text: pageText, lineBlocks: pageBlocks } = reconstructPageReadingOrder(
      items,
      viewport.width,
      viewport.height,
      pageNum,
      warnings
    );

    for (const block of pageBlocks) {
      block.lineNumber = globalLineNumber;
      block.lineIndex = globalLineNumber;
      globalLineNumber++;
      allLineBlocks.push(block);
    }

    fullText += `\n[PAGE ${pageNum}]\n` + pageText;
  }

  return { rawText: fullText.trim(), pageCount, lineBlocks: allLineBlocks };
}

// ─── 2. DOCX Extraction ──────────────────────────────────────────────────────

async function extractDOCX(
  file: File,
  warnings: string[]
): Promise<{ rawText: string; pageCount: number; lineBlocks: LineBlock[] }> {
  try {
    const JSZip = await getJSZipLib();
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('Invalid DOCX: word/document.xml not found.');
    }

    const xmlText = await docXmlFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    const lines: string[] = [];
    const body = xmlDoc.getElementsByTagName('w:body')[0];
    if (!body) {
      throw new Error('Invalid DOCX: word body empty.');
    }

    const children = Array.from(body.children);
    for (const node of children) {
      if (node.nodeName === 'w:p') {
        const textNodes = node.getElementsByTagName('w:t');
        const pText = Array.from(textNodes).map((t) => t.textContent || '').join('').trim();
        if (pText) {
          const numPr = node.getElementsByTagName('w:numPr')[0];
          if (numPr) {
            lines.push(`• ${pText}`);
          } else {
            lines.push(pText);
          }
        }
      } else if (node.nodeName === 'w:tbl') {
        const rows = Array.from(node.getElementsByTagName('w:tr'));
        for (const row of rows) {
          const cells = Array.from(row.getElementsByTagName('w:tc'));
          const cellTexts = cells.map((cell) => {
            const tNodes = cell.getElementsByTagName('w:t');
            return Array.from(tNodes).map((t) => t.textContent || '').join(' ').trim();
          }).filter(Boolean);

          if (cellTexts.length > 0) {
            lines.push(cellTexts.join(' | '));
          }
        }
      }
    }

    const lineBlocks: LineBlock[] = lines.map((line, idx) => ({
      lineNumber: idx + 1,
      lineIndex: idx + 1,
      pageNumber: 1,
      columnIndex: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      text: line,
      tokens: line.split(/\s+/).filter(Boolean),
    }));

    return { rawText: lines.join('\n'), pageCount: 1, lineBlocks };
  } catch (err: any) {
    warnings.push(`DOCX parser fallback: ${err.message}`);
    const buffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = textDecoder.decode(buffer);
    const clean = rawString.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
    const words = clean.split(/\s+/).filter((w) => w.length > 1 && !w.startsWith('w:') && !w.startsWith('xml'));
    const text = words.join(' ');
    return {
      rawText: text,
      pageCount: 1,
      lineBlocks: [{
        lineNumber: 1,
        lineIndex: 1,
        pageNumber: 1,
        columnIndex: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text,
        tokens: words,
      }],
    };
  }
}

// ─── 3. Lossless Normalization Engine ────────────────────────────────────────

export function normalizeText(rawText: string): string {
  let text = rawText
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .replace(/\r\n|\r/g, '\n')
    // Standardize bullet points to newlines with bullet character
    .replace(/([•\u2022\u25cf\u25cb\u25aa\u25a0]|\n\s*[*]\s+|\n\s*-\s+)/g, '\n• ')
    // De-hyphenate line-break wraps: "learn-\ning" -> "learning"
    .replace(/([a-zA-Z]{2,})-\n([a-zA-Z]{2,})/g, '$1$2')
    // Remove Page footer numbers
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

// ─── 4. Deterministic Section Detector ───────────────────────────────────────

export const SECTION_PATTERNS: { name: ExtractedSection['normalizedName']; pattern: RegExp }[] = [
  {
    name: 'summary',
    pattern: /^(profile\s*summary|professional\s*summary|summary\s*of\s*qualifications|executive\s*summary|career\s*summary|summary|profile|about\s*me|about|objective|career\s*objective)$/i,
  },
  {
    name: 'skills',
    pattern: /^(technical\s*skills|core\s*competencies|skills\s*&?\s*competencies|skills\s*&?\s*abilities|key\s*skills|areas\s*of\s*expertise|technical\s*stack|technologies|tools\s*&?\s*technologies|core\s*skills|skills)$/i,
  },
  {
    name: 'experience',
    pattern: /^(work\s*experience|professional\s*experience|relevant\s*experience|employment\s*history|work\s*history|employment|experience|internships?|internship\s*experience|leadership\s*experience)$/i,
  },
  {
    name: 'projects',
    pattern: /^(key\s*projects|personal\s*projects|academic\s*projects|technical\s*projects|selected\s*projects|project\s*experience|projects\s*&?\s*initiatives|projects)$/i,
  },
  {
    name: 'education',
    pattern: /^(education|academic\s*background|academic\s*qualifications|educational\s*qualifications|academics|qualifications|degrees)$/i,
  },
  {
    name: 'certifications',
    pattern: /^(certifications?|certificates?|licenses?\s*&?\s*certifications?|professional\s*certifications?|accreditations?)$/i,
  },
  {
    name: 'achievements',
    pattern: /^(achievements\s*\/?\s*certifications|achievements\s*&?\s*awards|honors?\s*&?\s*awards|key\s*achievements|awards|honors|accomplishments|achievements)$/i,
  },
];

/**
 * Detects resume sections deterministically and computes exact start/end offsets.
 */
export function detectSections(normalizedText: string): ExtractedSection[] {
  const lines = normalizedText.split('\n');
  const sections: ExtractedSection[] = [];

  let currentSectionName = 'Header';
  let currentNormalizedName: ExtractedSection['normalizedName'] = 'header';
  let currentLines: string[] = [];
  let currentStartOffset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentLines.push('');
      continue;
    }

    let matchedSection: ExtractedSection['normalizedName'] | null = null;
    let matchedRawName = '';

    const cleanHeading = trimmed.replace(/^===SECTION:\s*([A-Z]+)===/i, '$1').replace(/^•\s*/, '').trim();

    if (cleanHeading.length < 60 && !trimmed.startsWith('•') && !trimmed.includes('@') && !trimmed.includes('|')) {
      for (const { name, pattern } of SECTION_PATTERNS) {
        if (pattern.test(cleanHeading) || cleanHeading.toUpperCase() === name.toUpperCase()) {
          matchedSection = name;
          matchedRawName = cleanHeading;
          break;
        }
      }
    }

    if (matchedSection) {
      if (currentLines.length > 0) {
        const sectionText = currentLines.join('\n').trim();
        if (sectionText) {
          sections.push({
            name: currentSectionName,
            normalizedName: currentNormalizedName,
            text: sectionText,
            startOffset: currentStartOffset,
            endOffset: currentStartOffset + sectionText.length,
          });
          currentStartOffset += sectionText.length + 1;
        }
      }

      currentSectionName = matchedRawName;
      currentNormalizedName = matchedSection;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const sectionText = currentLines.join('\n').trim();
    if (sectionText) {
      sections.push({
        name: currentSectionName,
        normalizedName: currentNormalizedName,
        text: sectionText,
        startOffset: currentStartOffset,
        endOffset: currentStartOffset + sectionText.length,
      });
    }
  }

  return sections;
}

/**
 * Maps LineBlocks to active sections using detected section boundaries.
 */
export function assignSectionsToLineBlocks(lineBlocks: LineBlock[], _sections?: ExtractedSection[]): LineBlock[] {
  let currentSection = 'header';

  return lineBlocks.map((block) => {
    const text = block.text.trim();
    if (text) {
      for (const { name, pattern } of SECTION_PATTERNS) {
        if (pattern.test(text) && text.length < 60 && !text.startsWith('•')) {
          currentSection = name;
          break;
        }
      }
    }
    return {
      ...block,
      section: currentSection,
    };
  });
}

// ─── 5. Generalized Project & Education Block Segmentation ───────────────────

/**
 * Deterministically splits project blocks BEFORE LLM invocation so multi-project resumes
 * are never merged, and bullet points are NEVER promoted to separate projects.
 */
export function detectProjectBoundaries(projectsSectionText: string, startLineOffset = 1): ExtractedProjectBlock[] {
  if (!projectsSectionText || !projectsSectionText.trim()) return [];

  const lines = projectsSectionText.split('\n').map((l) => l.trim()).filter(Boolean);
  const projects: ExtractedProjectBlock[] = [];
  let currentProject: { heading: string; lines: string[]; startLine: number } | null = null;
  let lineIdx = startLineOffset;

  for (const line of lines) {
    const isBullet = line.startsWith('•') || line.startsWith('*') || line.startsWith('-');
    const isMetaHeader = /^(tools|technologies|tech\s*stack|key\s*highlights|description|responsibilities|role|duration)\s*[:|-]/i.test(line);
    const endsWithPeriod = /\.\s*$/.test(line);
    const isActionVerbSentence = /^(developed|implemented|engineered|designed|supervised|created|built|utilized|handled|analyzed|evaluated|achieved|trained|fine-tuned|deployed)\b/i.test(line);

    // A project heading must be non-bullet, < 90 chars, not a sentence ending with period, not an action verb sentence
    const isHeadingCandidate = !isBullet && !isMetaHeader && !endsWithPeriod && !isActionVerbSentence && line.length < 90 && line.length > 3;

    if (isHeadingCandidate && (!currentProject || currentProject.lines.length > 0)) {
      if (currentProject) {
        const cleanHeading = currentProject.heading.replace(/^•\s*/, '').split('|')[0].trim();
        projects.push({
          id: `proj_${projects.length + 1}`,
          heading: cleanHeading,
          startLine: currentProject.startLine,
          endLine: lineIdx - 1,
          lines: currentProject.lines,
          blockText: [currentProject.heading, ...currentProject.lines].join('\n'),
          name: cleanHeading,
          text: currentProject.lines.join('\n'),
        });
      }
      currentProject = {
        heading: line,
        lines: [],
        startLine: lineIdx,
      };
    } else if (currentProject) {
      currentProject.lines.push(line.replace(/^•\s*/, ''));
    }

    lineIdx++;
  }

  if (currentProject) {
    const cleanHeading = currentProject.heading.replace(/^•\s*/, '').split('|')[0].trim();
    projects.push({
      id: `proj_${projects.length + 1}`,
      heading: cleanHeading,
      startLine: currentProject.startLine,
      endLine: lineIdx,
      lines: currentProject.lines,
      blockText: [currentProject.heading, ...currentProject.lines].join('\n'),
      name: cleanHeading,
      text: currentProject.lines.join('\n'),
    });
  }

  return projects;
}

/**
 * Deterministically groups education credentials (degree, institution, GPA, year) into
 * unified academic qualification blocks BEFORE LLM invocation so CGPA or institution lines
 * NEVER become separate education entities.
 */
export function detectEducationBoundaries(educationSectionText: string, startLineOffset = 1): ExtractedEducationBlock[] {
  if (!educationSectionText || !educationSectionText.trim()) return [];

  const rawLines = educationSectionText.split('\n').map((l) => l.trim()).filter(Boolean);
  const educationBlocks: ExtractedEducationBlock[] = [];

  const degreeKeywords = /\b(b\.?tech|b\.?e\.?|b\.?s\.?|b\.?a\.?|b\.?sc|bachelor|m\.?tech|m\.?s\.?|master|mba|ph\.?d|intermediate|higher\s*secondary|12th|10th|secondary\s*school|ssc|cbse|icse|high\s*school|diploma|associate)\b/i;

  let currentBlock: { lines: string[]; startLine: number } | null = null;
  let lineIdx = startLineOffset;

  for (const line of rawLines) {
    const cleanLine = line.replace(/^•\s*/, '').trim();
    const isDegreeLine = degreeKeywords.test(cleanLine);
    const isDelimitedLine = cleanLine.includes('|') || cleanLine.includes('–') || cleanLine.includes(' - ');

    // Start a new education block when a new degree keyword is encountered or when the previous block is complete
    if ((isDegreeLine || isDelimitedLine) && (!currentBlock || currentBlock.lines.length >= 1)) {
      if (currentBlock) {
        educationBlocks.push(synthesizeEducationBlock(currentBlock.lines, currentBlock.startLine, lineIdx - 1, educationBlocks.length + 1));
      }
      currentBlock = {
        lines: [cleanLine],
        startLine: lineIdx,
      };
    } else if (currentBlock) {
      currentBlock.lines.push(cleanLine);
    } else {
      currentBlock = {
        lines: [cleanLine],
        startLine: lineIdx,
      };
    }

    lineIdx++;
  }

  if (currentBlock && currentBlock.lines.length > 0) {
    educationBlocks.push(synthesizeEducationBlock(currentBlock.lines, currentBlock.startLine, lineIdx, educationBlocks.length + 1));
  }

  return educationBlocks;
}

/**
 * Extracts degree, institution, year, and grade from a grouped education block's lines.
 */
function synthesizeEducationBlock(lines: string[], startLine: number, endLine: number, blockNumber: number): ExtractedEducationBlock {
  const fullText = lines.join(' | ');

  // 1. Grade / CGPA / Percentage
  const gradeMatch = fullText.match(/\b(?:cgpa|gpa|percentage|marks|score)?\s*[:=]?\s*(\d+(?:\.\d+)?(?:\s*\/\s*10|\s*%)?)\b/i);
  const grade = gradeMatch ? gradeMatch[0].trim() : undefined;

  // 2. Year / Date Range
  const yearMatch = fullText.match(/\b(20\d\d\s*[-–]\s*(?:Present|20\d\d)|\d{4})\b/i);
  const year = yearMatch ? yearMatch[0].trim() : undefined;

  // 3. Degree and Institution parsing from delimited parts or lines
  const parts = lines.join(' | ').split(/[|–]/).map((p) => p.trim()).filter(Boolean);
  let degree = parts[0] || lines[0] || 'Degree';
  let institution = parts[1] || lines[1] || '';

  // Clean out grade and year from degree / institution strings
  if (grade) {
    degree = degree.replace(grade, '').trim();
    institution = institution.replace(grade, '').trim();
  }
  if (year) {
    degree = degree.replace(year, '').trim();
    institution = institution.replace(year, '').trim();
  }

  return {
    id: `edu_${blockNumber}`,
    degree: degree.replace(/^•\s*/, '').replace(/[,|–-]$/, '').trim(),
    institution: institution.replace(/^•\s*/, '').replace(/[,|–-]$/, '').trim(),
    year,
    grade,
    startLine,
    endLine,
    lines,
    blockText: lines.join('\n'),
  };
}

// ─── 6. Document Classification Gate ─────────────────────────────────────────

export function classifyDocument(
  sections: ExtractedSection[],
  rawTextLength: number,
  normalizedText: string
): DocumentClassification {
  const detectedNames = sections.map((s) => s.normalizedName);
  const lower = normalizedText.toLowerCase();

  // 1. Academic Document Check
  const academicIndicators = [
    /semester\s*(?:[1-8]|i|ii|iii|iv|v|vi|vii|viii)\b/i,
    /grade\s*card|marks\s*sheet|transcript\s*of\s*records|consolidated\s*marks/i,
    /subject\s*code|course\s*code|credit\s*points|grade\s*point\s*average/i,
    /hall\s*ticket|examination\s*branch|controller\s*of\s*examinations/i,
  ];

  const academicMatchCount = academicIndicators.filter((re) => re.test(lower)).length;
  const hasExperience = detectedNames.includes('experience');
  const hasProjects = detectedNames.includes('projects');
  const hasSkills = detectedNames.includes('skills');

  if (academicMatchCount >= 2 && !hasExperience && !hasProjects) {
    return {
      documentType: 'academic_document',
      documentQuality: 'good',
      extractedTextLength: rawTextLength,
      sectionsDetected: detectedNames,
      canProceed: false,
      rejectionReason: 'We couldn’t identify this document as a resume or CV. It appears to be an academic marks sheet or grade transcript. Please upload your resume or CV.',
    };
  }

  // 2. Certificate Check
  const certIndicators = [
    /this\s*is\s*to\s*certify\s*that/i,
    /certificate\s*of\s*(?:completion|participation|achievement|excellence)/i,
    /has\s*successfully\s*completed\s*the\s*course/i,
  ];

  if (certIndicators.some((re) => re.test(lower)) && !hasExperience && !hasProjects && !hasSkills) {
    return {
      documentType: 'certificate',
      documentQuality: 'good',
      extractedTextLength: rawTextLength,
      sectionsDetected: detectedNames,
      canProceed: false,
      rejectionReason: 'This document appears to be an individual course or completion certificate, not a full candidate resume. Please upload your complete resume.',
    };
  }

  // 3. Scanned image or unreadable document
  if (rawTextLength < 80) {
    return {
      documentType: 'unknown',
      documentQuality: 'unreadable',
      extractedTextLength: rawTextLength,
      sectionsDetected: detectedNames,
      canProceed: false,
      rejectionReason: 'We couldn’t extract enough text from this document. It may be a scanned image or corrupted PDF. Please upload a searchable text PDF or DOCX resume.',
    };
  }

  // 4. Quality Assessment
  let documentQuality: DocumentQuality = 'poor';
  if ((hasExperience || hasProjects) && hasSkills) {
    documentQuality = 'good';
  } else if (hasExperience || hasProjects || hasSkills || detectedNames.includes('education')) {
    documentQuality = 'partial';
  }

  const documentType: DocumentType = lower.includes('curriculum vitae') || lower.includes('cv') ? 'cv' : 'resume';

  return {
    documentType,
    documentQuality,
    extractedTextLength: rawTextLength,
    sectionsDetected: detectedNames,
    canProceed: true,
    warningMessage: documentQuality === 'poor'
      ? 'Resume content seems sparse. Consider verifying your sections during the review step.'
      : undefined,
  };
}

// ─── 7. Primary Document Extractor API ───────────────────────────────────────

export const documentExtractor = {
  async extractDocument(file: File): Promise<ExtractedDocument> {
    const warnings: string[] = [];
    let rawText = '';
    let pageCount = 1;
    let lineBlocks: LineBlock[] = [];

    const lowerName = file.name.toLowerCase();

    if (file.type.includes('pdf') || lowerName.endsWith('.pdf')) {
      const pdfRes = await extractPDF(file, warnings);
      rawText = pdfRes.rawText;
      pageCount = pdfRes.pageCount;
      lineBlocks = pdfRes.lineBlocks;
    } else if (file.type.includes('word') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      const docxRes = await extractDOCX(file, warnings);
      rawText = docxRes.rawText;
      pageCount = docxRes.pageCount;
      lineBlocks = docxRes.lineBlocks;
    } else {
      rawText = await file.text();
      const lines = rawText.split('\n');
      lineBlocks = lines.map((line, idx) => ({
        lineNumber: idx + 1,
        lineIndex: idx + 1,
        pageNumber: 1,
        columnIndex: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text: line.trim(),
        tokens: line.trim().split(/\s+/).filter(Boolean),
      })).filter((b) => b.text.length > 0);
    }

    const normalizedText = normalizeText(rawText);
    const sections = detectSections(normalizedText);
    const enrichedLineBlocks = assignSectionsToLineBlocks(lineBlocks, sections);

    const projectsSection = sections.find((s) => s.normalizedName === 'projects');
    const detectedProjects = projectsSection ? detectProjectBoundaries(projectsSection.text) : [];

    const educationSection = sections.find((s) => s.normalizedName === 'education');
    const detectedEducation = educationSection ? detectEducationBoundaries(educationSection.text) : [];

    const classification = classifyDocument(sections, rawText.length, normalizedText);

    return {
      rawText,
      normalizedText,
      sections,
      lineBlocks: enrichedLineBlocks,
      detectedProjects,
      detectedEducation,
      pageCount,
      characterCount: normalizedText.length,
      documentType: classification.documentType,
      documentQuality: classification.documentQuality,
      extractionWarnings: warnings,
    };
  },
};
