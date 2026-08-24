import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const WIDTH = 1024;
const HEIGHT = 1024;
const BG = [23, 62, 43];
const FG = [244, 248, 245];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  if (x >= left + radius && x <= right - radius && y >= top && y <= bottom) return true;
  if (y >= top + radius && y <= bottom - radius && x >= left && x <= right) return true;
  const corners = [
    [left + radius, top + radius],
    [right - radius, top + radius],
    [left + radius, bottom - radius],
    [right - radius, bottom - radius],
  ];
  return corners.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2);
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pointInTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const s1 = (px - cx) * (ay - cy) - (ax - cx) * (py - cy);
  const s2 = (px - ax) * (by - ay) - (bx - ax) * (py - ay);
  const s3 = (px - bx) * (cy - by) - (cx - bx) * (py - by);
  const hasNegative = s1 < 0 || s2 < 0 || s3 < 0;
  const hasPositive = s1 > 0 || s2 > 0 || s3 > 0;
  return !(hasNegative && hasPositive);
}

function isForeground(x, y) {
  const bars = [
    [260, 600, 360, 760, 28],
    [420, 500, 520, 760, 28],
    [580, 380, 680, 760, 28],
  ];
  if (bars.some(([left, top, right, bottom, radius]) => insideRoundedRect(x, y, left, top, right, bottom, radius))) {
    return true;
  }

  const trend = [[245, 485], [405, 370], [525, 430], [735, 255]];
  for (let index = 0; index < trend.length - 1; index += 1) {
    if (distanceToSegment(x, y, ...trend[index], ...trend[index + 1]) <= 28) return true;
  }

  return pointInTriangle(x, y, [735, 255], [640, 272], [705, 345]);
}

const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
let offset = 0;
for (let y = 0; y < HEIGHT; y += 1) {
  raw[offset++] = 0;
  for (let x = 0; x < WIDTH; x += 1) {
    const color = isForeground(x, y) ? FG : BG;
    raw[offset++] = color[0];
    raw[offset++] = color[1];
    raw[offset++] = color[2];
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.mkdirSync('assets', { recursive: true });
for (const filename of ['icon.png', 'adaptive-icon.png']) {
  fs.writeFileSync(path.join('assets', filename), png);
}

console.log(`Generated SparFlow icon (${png.length} bytes)`);
