import jsPDF from 'jspdf';
import type { AnalysisRecord } from '@/types';

export function exportCsv(record: AnalysisRecord): void {
  const rows: string[] = [];
  rows.push('Section,Field,Value');
  rows.push(`Summary,Title,"${escapeCsv(record.title)}"`);
  rows.push(`Summary,Source,"${escapeCsv(record.sourceLabel)}"`);
  rows.push(`Summary,Date,"${new Date(record.createdAt).toLocaleString()}"`);
  rows.push(`Summary,Total Items,${record.overall.totalItems}`);
  rows.push(`Summary,Positive,${(record.overall.positive * 100).toFixed(1)}%`);
  rows.push(`Summary,Neutral,${(record.overall.neutral * 100).toFixed(1)}%`);
  rows.push(`Summary,Negative,${(record.overall.negative * 100).toFixed(1)}%`);
  rows.push(`Summary,Average Score,${record.overall.averageScore.toFixed(3)}`);
  rows.push(`Summary,Dominant Emotion,${record.overall.dominantEmotion}`);
  rows.push('');
  rows.push('Keywords,Word,Count,Sentiment');
  for (const k of record.keywords) {
    rows.push(`Keyword,"${escapeCsv(k.word)}",${k.count},${k.sentiment}`);
  }
  rows.push('');
  rows.push('Topics,Topic,Count,Sentiment');
  for (const t of record.topics) {
    rows.push(`Topic,"${escapeCsv(t.topic)}",${t.count},${t.sentiment}`);
  }
  rows.push('');
  rows.push('Insights,,');
  record.insights.forEach((ins, i) => rows.push(`Insight ${i + 1},"${escapeCsv(ins)}"`));
  rows.push('');
  rows.push('Recommendations,,');
  record.recommendations.forEach((rec, i) =>
    rows.push(`Recommendation ${i + 1},"${escapeCsv(rec)}"`),
  );
  rows.push('');
  rows.push('Items,Source,Sentiment,Confidence,Text');
  for (const it of record.items) {
    rows.push(
      `Item,"${escapeCsv(it.source)}",${it.result.label},${(it.result.confidence * 100).toFixed(1)}%,"${escapeCsv(it.text.slice(0, 500))}"`,
    );
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  download(blob, `${sanitize(record.title)}.csv`);
}

function escapeCsv(v: string): string {
  return v.replace(/"/g, '""');
}

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'analysis';
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportPdf(record: AnalysisRecord): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header bar
  doc.setFillColor(7, 9, 11);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 68, pageW, 2, 'F');
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Sentinel AI', margin, 35);
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Sentiment Analysis Report', margin, 52);
  doc.text(new Date(record.createdAt).toLocaleString(), pageW - margin - 130, 52);

  y = 90;
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(record.title, margin, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Source: ${record.sourceLabel}  |  Items analyzed: ${record.overall.totalItems}`, margin, y);
  y += 25;

  // Summary
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Summary', margin, y);
  y += 16;
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = drawParagraph(doc, record.summary, margin, y, pageW - margin * 2, 14, ensureSpace);
  y += 10;

  // Stats
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Sentiment Distribution', margin, y);
  y += 18;
  const stats = [
    ['Positive', `${(record.overall.positive * 100).toFixed(1)}%`],
    ['Neutral', `${(record.overall.neutral * 100).toFixed(1)}%`],
    ['Negative', `${(record.overall.negative * 100).toFixed(1)}%`],
    ['Avg Score', record.overall.averageScore.toFixed(3)],
    ['Dominant Emotion', record.overall.dominantEmotion],
  ];
  doc.setFontSize(10);
  for (const [k, v] of stats) {
    ensureSpace(16);
    doc.setTextColor(80, 80, 80);
    doc.text(k, margin, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(v, margin + 150, y);
    doc.setFont('helvetica', 'normal');
    y += 16;
  }
  y += 10;

  // Draw simple bar chart for sentiment
  ensureSpace(80);
  const chartX = margin;
  const chartW = pageW - margin * 2;
  const barH = 24;
  const gap = 8;
  const sentiments = [
    { label: 'Positive', val: record.overall.positive, color: [34, 197, 94] as [number, number, number] },
    { label: 'Neutral', val: record.overall.neutral, color: [245, 158, 11] as [number, number, number] },
    { label: 'Negative', val: record.overall.negative, color: [239, 68, 68] as [number, number, number] },
  ];
  for (const s of sentiments) {
    ensureSpace(barH + gap);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.text(s.label, chartX, y - 4);
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(chartX, y, chartW, barH, 3, 3, 'F');
    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.roundedRect(chartX, y, chartW * s.val, barH, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(s.val * 100).toFixed(1)}%`, chartX + 6, y + 16);
    doc.setFont('helvetica', 'normal');
    y += barH + gap;
  }
  y += 10;

  // Keywords
  if (record.keywords.length) {
    ensureSpace(30);
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Top Keywords', margin, y);
    y += 18;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const kwText = record.keywords.slice(0, 15).map((k) => `${k.word} (${k.count})`).join(', ');
    y = drawParagraph(doc, kwText, margin, y, pageW - margin * 2, 14, ensureSpace);
    y += 10;
  }

  // Insights
  ensureSpace(30);
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AI Insights', margin, y);
  y += 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  for (const ins of record.insights) {
    y = drawParagraph(doc, `• ${ins}`, margin, y, pageW - margin * 2, 14, ensureSpace);
    y += 6;
  }
  y += 8;

  // Recommendations
  ensureSpace(30);
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Recommendations', margin, y);
  y += 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  for (const rec of record.recommendations) {
    y = drawParagraph(doc, `• ${rec}`, margin, y, pageW - margin * 2, 14, ensureSpace);
    y += 6;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Sentinel AI — AI-Powered Sentiment Analysis',
      margin,
      pageH - 16,
    );
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin - 60, pageH - 16);
  }

  doc.save(`${sanitize(record.title)}.pdf`);
}

function drawParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  ensureSpace: (h: number) => void,
): number {
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    ensureSpace(lineH);
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}
