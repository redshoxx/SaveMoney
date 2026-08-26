import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const WIDTH = 1024;
const HEIGHT = 1024;
const BG = [12, 18, 25];
const PIG = [215, 238, 222];
const COIN = [246, 194, 71];
const DETAIL = [22, 48, 40];

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

function insideEllipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) <= 1;
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

function pointInTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNegative && hasPositive);
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pigShape(x, y) {
  const body = insideEllipse(x, y, 535, 585, 270, 190);
  const head = insideEllipse(x, y, 300, 570, 135, 120);
  const snout = insideRoundedRect(x, y, 145, 545, 275, 625, 38);
  const ear = pointInTriangle(x, y, [250, 485], [300, 360], [365, 485]);
  const frontLeg = insideRoundedRect(x, y, 355, 700, 455, 835, 28);
  const rearLeg = insideRoundedRect(x, y, 610, 700, 710, 835, 28);
  const tailStem = distanceToSegment(x, y, 775, 550, 835, 505) <= 18;
  const tailRing = Math.abs(Math.hypot(x - 850, y - 500) - 45) <= 15 && x >= 835;
  return body || head || snout || ear || frontLeg || rearLeg || tailStem || tailRing;
}

function euroMark(x, y) {
  const arcDistance = Math.abs(Math.hypot(x - 530, y - 250) - 48);
  const arc = arcDistance <= 12 && x <= 552;
  const upper = x >= 495 && x <= 570 && y >= 226 && y <= 240;
  const lower = x >= 495 && x <= 570 && y >= 258 && y <= 272;
  return arc || upper || lower;
}

function pixelColor(x, y) {
  const coinOuter = insideEllipse(x, y, 535, 250, 118, 118);
  const coinInner = insideEllipse(x, y, 535, 250, 96, 96);
  const pig = pigShape(x, y);

  if (coinOuter) {
    if (!coinInner) return PIG;
    if (euroMark(x, y)) return DETAIL;
    return COIN;
  }

  if (pig) {
    const slot = insideRoundedRect(x, y, 430, 392, 640, 426, 17);
    const eye = insideEllipse(x, y, 265, 548, 15, 15);
    if (slot || eye) return DETAIL;
    return PIG;
  }

  return BG;
}

const raw = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
let offset = 0;
for (let y = 0; y < HEIGHT; y += 1) {
  raw[offset++] = 0;
  for (let x = 0; x < WIDTH; x += 1) {
    const color = pixelColor(x, y);
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

console.log(`Generated SparPilot savings icon (${png.length} bytes)`);
