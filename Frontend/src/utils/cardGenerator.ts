/**
 * Quote Card Generator for AnimeLog.
 * Generates an editorial Keyframe archival paper card (1200x675) matching the Night Studio
 * and Key-Frame Paper aesthetic using native HTML5 Canvas (zero external dependencies).
 */

export interface QuoteCardOptions {
  title: string;
  context: string;
  note: string;
  rating?: number | null;
}

function wrapQuoteLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (let i = 0; i < words.length; i += 1) {
    const candidate = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines - 1) {
        const rest = [line, ...words.slice(i + 1)].join(' ');
        let trimmed = rest;
        while (ctx.measureText(`${trimmed}…`).width > maxWidth && trimmed.length > 4) {
          trimmed = trimmed.slice(0, -1).trimEnd();
        }
        lines.push(`${trimmed}…`);
        return lines;
      }
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function downloadQuoteCard(options: QuoteCardOptions): void {
  const width = 1200;
  const height = 675;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Night studio frame background (#0d1017)
  ctx.fillStyle = '#0d1017';
  ctx.fillRect(0, 0, width, height);

  // Subtle studio outer frame border
  ctx.strokeStyle = 'rgba(242, 244, 248, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(22, 22, width - 44, height - 44, 14);
  ctx.stroke();

  // 2. Archival Key-Frame Paper sheet (#f4f6f1)
  const sheetX = 120;
  const sheetY = 68;
  const sheetW = width - 240;
  const sheetH = height - 136;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#f4f6f1';
  ctx.beginPath();
  ctx.roundRect(sheetX, sheetY, sheetW, sheetH, 8);
  ctx.fill();
  ctx.restore();

  // Crisp sheet edge
  ctx.strokeStyle = 'rgba(143, 176, 217, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(sheetX, sheetY, sheetW, sheetH, 8);
  ctx.stroke();

  // Animation peg holes at top center of the paper sheet
  const pegY = sheetY + 18;
  const centerX = sheetX + sheetW / 2;
  ctx.fillStyle = '#0d1017';
  ctx.beginPath();
  ctx.roundRect(centerX - 110, pegY - 5, 28, 10, 5);
  ctx.roundRect(centerX + 82, pegY - 5, 28, 10, 5);
  ctx.arc(centerX, pegY, 6, 0, Math.PI * 2);
  ctx.fill();

  // 3. Rating badge (top right, Keyframe gold for 9-10, dark ink for < 9)
  let rightReserved = 0;
  if (options.rating) {
    const isTopScore = options.rating >= 9;
    const scoreText = `${options.rating}/10`;
    ctx.font = '800 14px "Archivo", "Geist", system-ui, -apple-system, sans-serif';
    const scoreMetrics = ctx.measureText(scoreText);
    const pillW = scoreMetrics.width + 20;
    const pillH = 26;
    const pillX = sheetX + sheetW - 48 - pillW;
    const pillY = sheetY + 42;
    rightReserved = pillW + 16;

    ctx.fillStyle = isTopScore ? '#ffc857' : '#1e2430';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 6);
    ctx.fill();

    ctx.fillStyle = isTopScore ? '#0d1017' : '#f4f6f1';
    ctx.fillText(scoreText, pillX + 10, pillY + 18);
  }

  // Eyebrow metadata above Keyframe blue header rule
  ctx.fillStyle = '#566074';
  ctx.font = '700 13px "Geist", system-ui, -apple-system, sans-serif';
  const rawEyebrow = `${options.context.toUpperCase()} · ${options.title.toUpperCase()}`;
  const maxEyebrowW = sheetW - 96 - rightReserved;
  let eyebrowText = rawEyebrow;
  while (ctx.measureText(eyebrowText).width > maxEyebrowW && eyebrowText.length > 8) {
    eyebrowText = `${eyebrowText.slice(0, -2).trimEnd()}…`;
  }
  ctx.fillText(eyebrowText, sheetX + 48, sheetY + 60);

  // Keyframe blue header rule (#2d7ff9)
  const headerRuleY = sheetY + 78;
  ctx.strokeStyle = '#2d7ff9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sheetX + 48, headerRuleY);
  ctx.lineTo(sheetX + sheetW - 48, headerRuleY);
  ctx.stroke();

  // Subtle pencil-blue paper lines inside the note body
  const firstLineY = sheetY + 136;
  const lineHeight = 42;
  ctx.strokeStyle = 'rgba(143, 176, 217, 0.35)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 7; row += 1) {
    const ruleY = firstLineY + row * lineHeight + 10;
    if (ruleY >= sheetY + sheetH - 72) break;
    ctx.beginPath();
    ctx.moveTo(sheetX + 48, ruleY);
    ctx.lineTo(sheetX + sheetW - 48, ruleY);
    ctx.stroke();
  }

  // 4. Quotation text in Keyframe note serif (--kf-font-note / --kf-paper-ink)
  ctx.fillStyle = '#1e2430';
  ctx.font = 'italic 27px "Literata", Georgia, serif';
  const cleanNote = options.note.trim();
  const quoteText =
    cleanNote.startsWith('“') || cleanNote.startsWith('"') ? cleanNote : `“${cleanNote}”`;

  const lines = wrapQuoteLines(ctx, quoteText, sheetW - 96, 7);
  lines.forEach((line, idx) => {
    ctx.fillText(line, sheetX + 48, firstLineY + idx * lineHeight);
  });

  // 5. Footer divider & Keyframe brand
  const footerY = sheetY + sheetH - 52;
  ctx.strokeStyle = 'rgba(143, 176, 217, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sheetX + 48, footerY);
  ctx.lineTo(sheetX + sheetW - 48, footerY);
  ctx.stroke();

  ctx.fillStyle = '#2d7ff9';
  ctx.font = '700 12px "Geist", system-ui, -apple-system, sans-serif';
  ctx.fillText('ANIMELOG · KEYFRAME', sheetX + 48, footerY + 28);

  ctx.font = 'italic 13px "Literata", Georgia, serif';
  ctx.fillStyle = '#566074';
  const tagText = 'Memories and lessons from watching and reading';
  const tagMetrics = ctx.measureText(tagText);
  ctx.fillText(tagText, sheetX + sheetW - 48 - tagMetrics.width, footerY + 28);

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
