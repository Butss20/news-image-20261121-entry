// news-image-20261121 — draws the world news of Saturday 21 November 2026
// as a 1024x1024 PNG poster, Node 22 standard library only, fully
// deterministic (fixed strings, no clock, no randomness, no network).
// Writes the image to $MAKEFUN_OUTPUT_DIR/entry.png (default /output).
//
// The poster: masthead with the date, one lead story (Russia's missiles
// hitting Poland and Kyiv), then five more verified stories of the day's
// news cycle — Shenzhen, COP31, the ICJ, Denmark, and AI chips — each with
// a tag, a headline and one line of summary. A small geometric scene
// (night sky, missile arcs, the Dnipro with three bridges) illustrates
// the lead. Text is drawn with a 5x7 bitmap font authored for this entry.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- font
// A 5x7 bitmap font: each glyph is 7 rows; each row is 5 bits, bit 4 (16)
// is the leftmost pixel. Authored for this entry, uppercase plus digits
// and punctuation. Unknown characters fall back to '?'.
const FONT: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x0e, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x01, 0x0e],
  '.': [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ',': [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  '-': [0, 0, 0, 0x0e, 0, 0, 0],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0],
  ':': [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ';': [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  '?': [0x0e, 0x11, 0x01, 0x06, 0x04, 0, 0x04],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '/': [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  '&': [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  '%': [0x19, 0x1a, 0x02, 0x04, 0x08, 0x0b, 0x13],
  '+': [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  '=': [0, 0, 0x1f, 0, 0x1f, 0, 0],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  '•': [0, 0, 0x0e, 0x0e, 0x0e, 0, 0],
  '—': [0, 0, 0, 0x1f, 0, 0, 0],
  '’': [0x04, 0x04, 0x08, 0, 0, 0, 0],
};

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const buf = new Uint8Array(W * H * 3);

type RGB = [number, number, number];
const PAPER: RGB = [250, 246, 236];
const INK: RGB = [17, 24, 39];
const NAVY: RGB = [22, 40, 63];
const RED: RGB = [185, 28, 28];
const GOLD: RGB = [201, 162, 39];
const GREY: RGB = [107, 114, 128];
const LIGHT: RGB = [226, 220, 205];
const SKY: RGB = [30, 58, 95];
const RIVER: RGB = [59, 89, 130];
const WHITE: RGB = [255, 255, 255];
const AMBER: RGB = [245, 158, 11];
const ORANGE: RGB = [234, 88, 12];

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
  }
}

// Bresenham line.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function thickLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
  const half = Math.floor(t / 2);
  for (let ox = -half; ox <= half; ox++) {
    for (let oy = -half; oy <= half; oy++) {
      line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, c);
    }
  }
}

// Filled circle by horizontal scanlines.
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x++) px(cx + x, cy + y, c);
  }
}

// Starburst: n rays from (cx, cy), alternating long and short.
function burst(cx: number, cy: number, r1: number, r2: number, n: number, c: RGB): void {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = k % 2 === 0 ? r1 : r2;
    const x1 = Math.round(cx + Math.cos(a) * r);
    const y1 = Math.round(cy + Math.sin(a) * r);
    thickLine(cx, cy, x1, y1, 2, c);
  }
  disc(cx, cy, Math.max(2, Math.floor(r2 / 3)), c);
}

// Parabola arc from (x0, y0) to (x1, y1) peaking `peak` pixels above the
// straight line, drawn as short segments.
function arc(x0: number, y0: number, x1: number, y1: number, peak: number, c: RGB): void {
  const steps = 24;
  let px0 = x0;
  let py0 = y0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t - peak * 4 * t * (1 - t));
    line(px0, py0, x, y, c);
    px0 = x;
    py0 = y;
  }
}

// ---------------------------------------------------------------- text
function glyph(ch: string): number[] {
  return FONT[ch] ?? FONT['?'];
}

function textWidth(s: string, scale: number): number {
  const t = s.toUpperCase();
  if (t.length === 0) return 0;
  return t.length * 6 * scale - scale;
}

function drawText(x: number, y: number, s: string, scale: number, c: RGB): void {
  const t = s.toUpperCase();
  let cx = x;
  for (const ch of t) {
    const g = glyph(ch);
    for (let r = 0; r < 7; r++) {
      const row = g[r];
      for (let col = 0; col < 5; col++) {
        if (row & (16 >> col)) {
          rect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

// Greedy word wrap to at most maxLines lines of maxWidth pixels.
function wrapText(s: string, maxWidth: number, scale: number, maxLines: number): string[] {
  const words = s.toUpperCase().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur === '' ? w : cur + ' ' + w;
    if (textWidth(next, scale) <= maxWidth || cur === '') {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && cur !== '') lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- PNG
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    Buffer.from(buf.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- poster
const MARGIN = 48;
const CONTENT_W = W - MARGIN * 2;

interface Story {
  tag: string;
  color: RGB;
  headline: string;
  summary: string;
}

const STORIES: Story[] = [
  {
    tag: 'SUMMIT',
    color: [183, 121, 31],
    headline: 'TRUMP, XI AND PUTIN SIGN PEACE DECLARATION',
    summary: 'FIRST TRILATERAL SUMMIT IN SHENZHEN: NO NUCLEAR WAR, UN REFORM.',
  },
  {
    tag: 'CLIMATE',
    color: [47, 125, 50],
    headline: 'COP31 TALKS RUN INTO SATURDAY WITH NO DEAL',
    summary: 'ANTALYA DRAFT DROPS FOSSIL FUELS; NEW TEXT DUE SATURDAY.',
  },
  {
    tag: 'JUSTICE',
    color: [30, 58, 95],
    headline: 'WORLD COURT: MYANMAR COMMITTED GENOCIDE',
    summary: 'ICJ FINDS MYANMAR GUILTY OVER THE ROHINGYA, A HISTORIC FIRST.',
  },
  {
    tag: 'DENMARK',
    color: [185, 28, 28],
    headline: 'DENMARK FOILS RUSSIAN PLOT, EXPELS ENVOY',
    summary: 'MOSCOW PLANNED TO KILL RAPPER KYIVSTONER; ATTACHE EXPELLED.',
  },
  {
    tag: 'TECH',
    color: [107, 33, 168],
    headline: 'US LET 879,000 AI CHIPS GO TO CHINA',
    summary: 'HOUSE PANEL: 879,000 NVIDIA, AMD CHIPS CLEARED FOR CHINA.',
  },
];

function drawPoster(): void {
  rect(0, 0, W, H, PAPER);

  // Masthead.
  rect(0, 0, W, 108, NAVY);
  drawText(MARGIN, 30, 'WORLD NEWS', 7, WHITE);
  const date = 'SATURDAY 21 NOVEMBER 2026';
  drawText(W - MARGIN - textWidth(date, 3), 42, date, 3, GOLD);
  rect(0, 108, W, 6, RED);

  // Lead story.
  let y = 132;
  drawText(MARGIN, y, 'WAR IN EUROPE', 2, RED);
  y += 30;
  const lead = 'RUSSIAN MISSILES HIT POLAND AND KYIV';
  const leadLines = wrapText(lead, CONTENT_W, 5, 2);
  for (const ln of leadLines) {
    drawText(MARGIN, y, ln, 5, INK);
    y += 35 + 8;
  }
  y += 6;
  const summary =
    'MORE THAN 110 MISSILES AND 400 DRONES STRUCK UKRAINE OVERNIGHT. ' +
    'THREE KYIV BRIDGES WERE HIT, AT LEAST 8 PEOPLE WERE KILLED, AND A ' +
    'RUSSIAN CRUISE MISSILE CROSSED INTO NATO MEMBER POLAND. NATO ' +
    'SCRAMBLED JETS; PM TUSK CALLED IT A DELIBERATE PROVOCATION.';
  const sumLines = wrapText(summary, CONTENT_W, 2, 4);
  for (const ln of sumLines) {
    drawText(MARGIN, y, ln, 2, INK);
    y += 20;
  }

  // Lead illustration: night sky, missile arcs, the Dnipro and its bridges.
  const gy = 336;
  const gh = 164;
  rect(MARGIN, gy, CONTENT_W, gh, SKY);
  // Stars (fixed positions).
  const stars: [number, number][] = [
    [90, 352], [180, 344], [260, 360], [340, 348], [430, 356], [520, 344],
    [610, 358], [700, 346], [790, 356], [880, 348], [940, 360], [120, 372],
    [300, 374], [480, 372], [660, 374], [840, 372],
  ];
  for (const [sx, sy] of stars) disc(sx, sy, 2, WHITE);
  // Missile arcs with bright heads.
  arc(120, 470, 420, 380, 70, GOLD);
  disc(420, 380, 5, AMBER);
  burst(420, 380, 16, 7, 8, AMBER);
  arc(560, 474, 860, 392, 60, GOLD);
  disc(860, 392, 5, AMBER);
  burst(860, 392, 16, 7, 8, AMBER);
  // River band and three bridges: each bridge is a white deck with two
  // piers in the water and an arch rising above the deck; the middle one
  // carries an explosion burst.
  rect(MARGIN, 452, CONTENT_W, 48, RIVER);
  for (const bx of [150, 470, 790]) {
    // Deck.
    thickLine(bx, 456, bx + 130, 456, 3, WHITE);
    // Two piers down into the river.
    rect(bx + 8, 456, 6, 40, WHITE);
    rect(bx + 116, 456, 6, 40, WHITE);
    // Arch above the deck.
    arc(bx + 8, 456, bx + 116, 456, 20, WHITE);
    // Explosion above the middle bridge.
    if (bx === 470) burst(bx + 62, 414, 22, 10, 10, ORANGE);
  }

  // Divider under the lead.
  rect(MARGIN, 516, CONTENT_W, 2, LIGHT);

  // Secondary stories.
  let ry = 532;
  const ROW_H = 88;
  for (let i = 0; i < STORIES.length; i++) {
    const st = STORIES[i];
    // Tag chip.
    rect(MARGIN, ry + 6, 150, 36, st.color);
    const tw = textWidth(st.tag, 2);
    drawText(MARGIN + Math.floor((150 - tw) / 2), ry + 15, st.tag, 2, WHITE);
    // Headline and summary.
    const tx = MARGIN + 150 + 18;
    const tw2 = W - MARGIN - tx;
    drawText(tx, ry + 4, st.headline, 3, INK);
    const sl = wrapText(st.summary, tw2, 2, 2);
    let sy = ry + 36;
    for (const ln of sl) {
      drawText(tx, sy, ln, 2, GREY);
      sy += 18;
    }
    if (i < STORIES.length - 1) rect(MARGIN, ry + ROW_H - 2, CONTENT_W, 2, LIGHT);
    ry += ROW_H;
  }

  // Footer.
  rect(MARGIN, 972, CONTENT_W, 2, LIGHT);
  drawText(
    MARGIN,
    986,
    'SOURCES: REUTERS, AP, CNN, WSJ, THE TIMES, UN NEWS - 21 NOV 2026',
    2,
    GREY,
  );
}

// ---------------------------------------------------------------- main
drawPoster();
const png = encodePNG();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
