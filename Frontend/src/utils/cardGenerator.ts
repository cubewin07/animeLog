/**
 * Quote Card Generator for AnimeLog.
 * Generates an editorial paper-slip visual card (1200x675) matching the "Still & Spine" aesthetic
 * using native HTML5 Canvas (zero external dependencies).
 */

export interface QuoteCardOptions {
  title: string;
  context: string;
  note: string;
  rating?: number | null;
}

export function downloadQuoteCard(options: QuoteCardOptions): void {
  const width = 1200;
  const height = 675;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Dark desk background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#141312');
  bgGrad.addColorStop(1, '#1b1917');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle border
  ctx.strokeStyle = '#2d2825';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // 2. Paper Slip dimensions
  const slipX = 140;
  const slipY = 80;
  const slipW = width - 280;
  const slipH = height - 160;

  // Slip shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#faf8f5';
  ctx.beginPath();
  ctx.roundRect(slipX, slipY, slipW, slipH, 8);
  ctx.fill();
  ctx.restore();

  // Fine paper border
  ctx.strokeStyle = '#e6dfd5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(slipX, slipY, slipW, slipH, 8);
  ctx.stroke();

  // 3. Eyebrow: Source
  ctx.fillStyle = '#78716c';
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '0.08em';
  const eyebrowText = `${options.context.toUpperCase()} · ${options.title.toUpperCase()}`;
  ctx.fillText(eyebrowText.slice(0, 75), slipX + 50, slipY + 60);

  // Rating badge if present
  if (options.rating) {
    const starText = `★ ${options.rating}/10`;
    ctx.font = '600 13px ui-monospace, monospace';
    ctx.fillStyle = '#92400e';
    const starMetrics = ctx.measureText(starText);
    const starX = slipX + slipW - 50 - starMetrics.width - 16;
    const starY = slipY + 44;
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(starX, starY, starMetrics.width + 16, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.fillText(starText, starX + 8, starY + 16);
  }

  // 4. Quotation text (wrapped in Newsreader serif)
  ctx.fillStyle = '#1c1917';
  ctx.font = 'italic 28px "Newsreader", Georgia, serif';
  const cleanNote = options.note.trim();
  const quoteText = cleanNote.startsWith('“') || cleanNote.startsWith('"') ? cleanNote : `“${cleanNote}”`;

  const maxTextW = slipW - 100;
  const words = quoteText.split(' ');
  let line = '';
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTextW && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
      if (lines.length >= 7) {
        line = line + '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let textY = slipY + 130;
  const lineHeight = 42;
  for (const l of lines) {
    ctx.fillText(l.trim(), slipX + 50, textY);
    textY += lineHeight;
  }

  // 5. Footer divider & brand
  const footerY = slipY + slipH - 45;
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(slipX + 50, footerY);
  ctx.lineTo(slipX + slipW - 50, footerY);
  ctx.stroke();

  ctx.fillStyle = '#a8a29e';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('ANIMELOG · STILL & SPINE', slipX + 50, footerY + 26);

  ctx.font = 'italic 12px "Newsreader", Georgia, serif';
  ctx.fillStyle = '#78716c';
  const tagText = 'Memories and lessons from watching and reading';
  const tagMetrics = ctx.measureText(tagText);
  ctx.fillText(tagText, slipX + slipW - 50 - tagMetrics.width, footerY + 26);

  // Trigger download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = options.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
    a.download = `animelog-quote-${safeTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
