import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Papa from 'papaparse';
import { extractText } from './textUtils';

// Configure pdfjs worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export async function parsePdf(file: File): Promise<string[]> {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((it: unknown) => (it as { str?: string }).str ?? '')
        .join(' ');
      if (text.trim()) pages.push(text);
    }
    if (!pages.length) throw new Error('No text could be extracted from this PDF.');
    return pages;
  } catch {
    throw new Error('This PDF could not be parsed. It may be scanned or corrupted.');
  }
}

export async function parseDocx(file: File): Promise<string[]> {
  try {
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    const text = result.value;
    if (!text.trim()) throw new Error('No text found in this document.');
    // Split by paragraphs
    return text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  } catch {
    throw new Error('This DOCX file could not be parsed.');
  }
}

export async function parseTxt(file: File): Promise<string[]> {
  const text = await file.text();
  if (!text.trim()) throw new Error('This text file is empty.');
  return text
    .split(/\n{2,}|\n(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function parseCsv(
  file: File,
): Promise<{ rows: Record<string, string>[]; textColumn: string; items: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data.filter((r) => Object.keys(r).length > 0);
        if (!rows.length) {
          reject(new Error('This CSV file has no data rows.'));
          return;
        }
        // Detect the text column: the one with longest average string length
        const cols = Object.keys(rows[0]);
        let best = cols[0];
        let bestAvg = 0;
        for (const col of cols) {
          const avg =
            rows.reduce((s, r) => s + (String(r[col] ?? '').length), 0) / rows.length;
          if (avg > bestAvg) {
            bestAvg = avg;
            best = col;
          }
        }
        const items = rows
          .map((r, idx) => {
            const t = String(r[best] ?? '').trim();
            return t || `row ${idx + 1}: ${JSON.stringify(r).slice(0, 200)}`;
          })
          .filter((t) => t.length > 2);
        if (!items.length) reject(new Error('No analyzable text column found in this CSV.'));
        else resolve({ rows, textColumn: best, items });
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

export { extractText };
