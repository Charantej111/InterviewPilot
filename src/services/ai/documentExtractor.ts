import type {
  ExtractedDocument,
  ExtractedSection,
  DocumentType,
  DocumentQuality,
  DocumentClassification,
} from '../../types/resume';

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL: boolean;
}

/**
 * Loads PDF.js library dynamically from CDN if not already in window scope.
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
 * Loads JSZip library dynamically for DOCX XML extraction.
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

// ─── 1. PDF Positional Extraction & Reading-Order Reconstruction ─────────────

/**
 * Reconstructs reading order of a single page by analyzing spatial layout.
 * Detects whether the page is single-column, multi-column (2-column), or has spanning headers.
 */
function reconstructPageReadingOrder(
  items: TextItem[],
  pageWidth: number,
  pageHeight: number,
  warnings: string[]
): string {
  if (items.length === 0) return '';

  // 1. Group items by vertical lines (proximity threshold: 3.5px)
  // PDF coordinates: (0,0) is bottom-left, so higher Y = top of page
  const sortedByYDesc = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  // 2. Detect Column Structure
  // Filter items that have meaningful width and text
  const contentItems = sortedByYDesc.filter((it) => it.str.trim().length > 0);
  if (contentItems.length < 5) {
    return contentItems.map((it) => it.str).join(' ');
  }

  // Calculate histogram of X positions to detect 2-column gutter
  const midX = pageWidth / 2;
  const leftItems: TextItem[] = [];
  const rightItems: TextItem[] = [];
  const spanningItems: TextItem[] = [];

  // Determine split point (gutter)
  const leftXValues = contentItems.map((i) => i.x).filter((x) => x < midX - 30);
  const rightXValues = contentItems.map((i) => i.x).filter((x) => x > midX - 30);

  const isTwoColumn =
    leftXValues.length > 8 &&
    rightXValues.length > 8 &&
    leftXValues.length + rightXValues.length >= contentItems.length * 0.65;

  if (isTwoColumn) {
    for (const item of contentItems) {
      const itemRight = item.x + item.width;
      // Header item spanning across columns
      if (item.x < midX - 40 && itemRight > midX + 40 && item.width > pageWidth * 0.5) {
        spanningItems.push(item);
      } else if (item.x < midX) {
        leftItems.push(item);
      } else {
        rightItems.push(item);
      }
    }

    // Check if reading order is clear
    if (Math.abs(leftItems.length - rightItems.length) > contentItems.length * 0.8) {
      warnings.push('Asymmetric column layout detected; reading order may have minor variations.');
    }

    // Sort spanning header items (e.g. Candidate Name, Contact Header)
    const headerLines = renderLineGroupedItems(spanningItems.filter((i) => i.y > pageHeight * 0.7));
    const footerLines = renderLineGroupedItems(spanningItems.filter((i) => i.y <= pageHeight * 0.7));
    const leftColumnLines = renderLineGroupedItems(leftItems);
    const rightColumnLines = renderLineGroupedItems(rightItems);

    return [headerLines, leftColumnLines, rightColumnLines, footerLines]
      .filter((s) => s.trim().length > 0)
      .join('\n\n');
  }

  // Single-column: Group items into lines and sort naturally
  return renderLineGroupedItems(contentItems);
}

/**
 * Groups items into lines by Y proximity and renders left-to-right text with whitespace
 */
function renderLineGroupedItems(items: TextItem[]): string {
  if (items.length === 0) return '';

  const lines: { y: number; items: TextItem[] }[] = [];
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  for (const item of sorted) {
    const matchedLine = lines.find((line) => Math.abs(line.y - item.y) <= 3.5);
    if (matchedLine) {
      matchedLine.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  // Sort each line's items left to right
  const renderedLines = lines.map((line) => {
    const lineItems = line.items.sort((a, b) => a.x - b.x);
    let lineStr = '';
    for (let i = 0; i < lineItems.length; i++) {
      const cur = lineItems[i];
      const prev = lineItems[i - 1];
      if (prev) {
        const gap = cur.x - (prev.x + prev.width);
        if (gap > 4) {
          lineStr += ' ';
        }
      }
      lineStr += cur.str;
    }
    return lineStr.trim();
  });

  return renderedLines.filter((l) => l.length > 0).join('\n');
}

/**
 * Extracts full text from PDF with positional spatial layout reconstruction.
 */
async function extractPDF(file: File, warnings: string[]): Promise<{ rawText: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await getPdfJsLib();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  const pageCount = pdf.numPages;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items: TextItem[] = (textContent.items as any[]).map((it) => ({
      str: it.str || '',
      x: it.transform ? it.transform[4] : 0,
      y: it.transform ? it.transform[5] : 0,
      width: it.width || 0,
      height: it.height || 0,
      hasEOL: Boolean(it.hasEOL),
    }));

    const pageText = reconstructPageReadingOrder(items, viewport.width, viewport.height, warnings);
    fullText += `\n[PAGE ${pageNum}]\n` + pageText;
  }

  return { rawText: fullText.trim(), pageCount };
}

// ─── 2. DOCX Extraction with Paragraphs, Headings & Tables ──────────────────

/**
 * Extracts structured text from DOCX file including table grids and paragraphs.
 */
async function extractDOCX(file: File, warnings: string[]): Promise<{ rawText: string; pageCount: number }> {
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

    // Parse body elements in exact document sequence (paragraphs and tables)
    const body = xmlDoc.getElementsByTagName('w:body')[0];
    if (!body) {
      throw new Error('Invalid DOCX: word body empty.');
    }

    const children = Array.from(body.children);
    for (const node of children) {
      if (node.nodeName === 'w:p') {
        // Paragraph
        const textNodes = node.getElementsByTagName('w:t');
        const pText = Array.from(textNodes).map((t) => t.textContent || '').join('').trim();
        if (pText) {
          // Detect bullet formatting
          const numPr = node.getElementsByTagName('w:numPr')[0];
          if (numPr) {
            lines.push(`• ${pText}`);
          } else {
            lines.push(pText);
          }
        }
      } else if (node.nodeName === 'w:tbl') {
        // Table: Preserve cell relationships (e.g. Date | Company | Role)
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

    return { rawText: lines.join('\n'), pageCount: 1 };
  } catch (err: any) {
    warnings.push(`DOCX advanced XML parser fallback: ${err.message}`);
    // Fallback: UTF-8 decoder text match
    const buffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = textDecoder.decode(buffer);
    const clean = rawString.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
    const words = clean.split(/\s+/).filter((w) => w.length > 1 && !w.startsWith('w:') && !w.startsWith('xml'));
    return { rawText: words.join(' '), pageCount: 1 };
  }
}

// ─── 3. Lossless Normalization Engine ────────────────────────────────────────

/**
 * Normalizes extracted text safely without losing evidence, dates, or bullet boundaries.
 */
export function normalizeText(rawText: string): string {
  let text = rawText
    // Remove control characters except standard whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Normalize line endings
    .replace(/\r\n|\r/g, '\n')
    // Standardize bullet points to explicit newlines
    .replace(/([•\u2022\u25cf\u25cb\u25aa\u25a0]|\s\*\s|\s-\s(?=[A-Z0-9]))/g, '\n• ')
    // Normalize ligatures
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    // Fix hyphenated line breaks (e.g. "experi-\nence" -> "experience")
    .replace(/([a-zA-Z]{2,})-\n([a-zA-Z]{2,})/g, '$1$2')
    // Remove repeated page numbers (e.g. "Page 1 of 2" or "[PAGE 1]")
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    // Normalize horizontal whitespace while preserving single spaces
    .replace(/[ \t]+/g, ' ')
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

// ─── 4. Deterministic Section Detector ───────────────────────────────────────

export const SECTION_PATTERNS: { name: ExtractedSection['normalizedName']; pattern: RegExp }[] = [
  {
    name: 'summary',
    pattern: /^(profile\s*summary|professional\s*summary|summary\s*of\s*qualifications|executive\s*summary|career\s*summary|summary|profile|about\s*me|about|objective|career\s*objective)/im,
  },
  {
    name: 'skills',
    pattern: /^(technical\s*skills|core\s*competencies|skills\s*&?\s*competencies|skills\s*&?\s*abilities|key\s*skills|areas\s*of\s*expertise|technical\s*stack|technologies|tools\s*&?\s*technologies|core\s*skills|skills)/im,
  },
  {
    name: 'experience',
    pattern: /^(work\s*experience|professional\s*experience|relevant\s*experience|employment\s*history|work\s*history|employment|experience|internships?|internship\s*experience|leadership\s*experience)/im,
  },
  {
    name: 'projects',
    pattern: /^(key\s*projects|personal\s*projects|academic\s*projects|technical\s*projects|selected\s*projects|project\s*experience|projects\s*&?\s*initiatives|projects)/im,
  },
  {
    name: 'education',
    pattern: /^(education|academic\s*background|academic\s*qualifications|educational\s*qualifications|academics|qualifications|degrees)/im,
  },
  {
    name: 'certifications',
    pattern: /^(certifications?|certificates?|licenses?\s*&?\s*certifications?|professional\s*certifications?|accreditations?)/im,
  },
  {
    name: 'achievements',
    pattern: /^(achievements\s*\/?\s*certifications|achievements\s*&?\s*awards|honors?\s*&?\s*awards|key\s*achievements|awards|honors|accomplishments|achievements)/im,
  },
];

/**
 * Detects resume sections deterministically and computes exact start/end offsets.
 */
export function detectSections(normalizedText: string): ExtractedSection[] {
  // Ensure clear line breaks before section keywords
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

    // Check if line matches any section heading
    if (trimmed.length < 60 && !trimmed.startsWith('•') && !trimmed.includes('@') && !trimmed.includes('|')) {
      for (const { name, pattern } of SECTION_PATTERNS) {
        if (pattern.test(trimmed)) {
          matchedSection = name;
          matchedRawName = trimmed;
          break;
        }
      }
    }

    if (matchedSection) {
      // Save previous section
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

  // Push final section
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

// ─── 5. Document Classification Gate ─────────────────────────────────────────

/**
 * Classifies document deterministically before AI extraction.
 * Rejects marks sheets, certificates, transcripts, or unreadable files with a helpful reason.
 */
export function classifyDocument(
  sections: ExtractedSection[],
  rawTextLength: number,
  normalizedText: string
): DocumentClassification {
  const detectedNames = sections.map((s) => s.normalizedName);
  const lower = normalizedText.toLowerCase();

  // 1. Quality Check: Scanned image or unreadable document
  if (rawTextLength < 150) {
    return {
      documentType: 'unknown',
      documentQuality: 'unreadable',
      extractedTextLength: rawTextLength,
      sectionsDetected: detectedNames,
      canProceed: false,
      rejectionReason: 'We couldn’t extract enough text from this document. It may be a scanned image or corrupted PDF. Please upload a searchable text PDF or DOCX resume.',
    };
  }

  // 2. Academic Document Check (Marks Sheets, Transcripts, Grade Cards)
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

  // 3. Certificate Check
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

  // 4. Quality Assessment for Valid Resumes
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

// ─── 6. Primary Document Extractor API ───────────────────────────────────────

export const documentExtractor = {
  /**
   * Main entry point: Extracts, positional-sorts, normalizes, detects sections,
   * and classifies any uploaded PDF or DOCX file.
   */
  async extractDocument(file: File): Promise<ExtractedDocument> {
    const warnings: string[] = [];
    let rawText = '';
    let pageCount = 1;

    const lowerName = file.name.toLowerCase();

    if (file.type.includes('pdf') || lowerName.endsWith('.pdf')) {
      const pdfRes = await extractPDF(file, warnings);
      rawText = pdfRes.rawText;
      pageCount = pdfRes.pageCount;
    } else if (file.type.includes('word') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      const docxRes = await extractDOCX(file, warnings);
      rawText = docxRes.rawText;
      pageCount = docxRes.pageCount;
    } else {
      // Plain text or markdown
      rawText = await file.text();
    }

    const normalizedText = normalizeText(rawText);
    const sections = detectSections(normalizedText);
    const classification = classifyDocument(sections, rawText.length, normalizedText);

    return {
      rawText,
      normalizedText,
      sections,
      pageCount,
      characterCount: normalizedText.length,
      documentType: classification.documentType,
      documentQuality: classification.documentQuality,
      extractionWarnings: warnings,
    };
  },
};
