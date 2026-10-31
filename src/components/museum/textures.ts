import * as THREE from 'three';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const DISPLAY_FONT = 'Amiri, "Noto Naskh Arabic", serif';
const STONE_TILE_SIZE = 512;

export function toArabicDigits(value: number): string {
  return value.toString().replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is unavailable');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  return texture;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

interface StonePattern {
  rowHeight: number;
  minBlockWidth: number;
  maxBlockWidth: number;
  staggered: boolean;
  mortar: string;
  hue: number;
  saturation: number;
  lightness: number;
  seed: number;
}

function drawStonePattern(ctx: CanvasRenderingContext2D, pattern: StonePattern) {
  const random = seededRandom(pattern.seed);
  const size = STONE_TILE_SIZE;
  const inset = 3;
  ctx.fillStyle = pattern.mortar;
  ctx.fillRect(0, 0, size, size);

  const rows = size / pattern.rowHeight;
  for (let row = 0; row < rows; row++) {
    const y = row * pattern.rowHeight;
    let x = pattern.staggered ? -random() * pattern.maxBlockWidth : 0;
    while (x < size) {
      const width = pattern.minBlockWidth + random() * (pattern.maxBlockWidth - pattern.minBlockWidth);
      const light = pattern.lightness + (random() - 0.5) * 10;
      const hue = pattern.hue + (random() - 0.5) * 6;
      ctx.fillStyle = `hsl(${hue}, ${pattern.saturation}%, ${light}%)`;
      for (const shift of [-size, 0, size]) {
        ctx.fillRect(x + shift + inset, y + inset, width - inset * 2, pattern.rowHeight - inset * 2);
      }
      x += width;
    }
  }

  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = random() > 0.5 ? 'rgba(255,240,215,0.05)' : 'rgba(60,40,20,0.06)';
    ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
  }
}

export function createWallStoneTexture(repeatX: number, repeatY: number) {
  const { canvas, ctx } = createCanvas(STONE_TILE_SIZE, STONE_TILE_SIZE);
  drawStonePattern(ctx, {
    rowHeight: 64,
    minBlockWidth: 80,
    maxBlockWidth: 170,
    staggered: true,
    mortar: '#6e5638',
    hue: 34,
    saturation: 42,
    lightness: 64,
    seed: 7,
  });
  return toTexture(canvas, repeatX, repeatY);
}

export function createFloorTileTexture(repeatX: number, repeatY: number) {
  const { canvas, ctx } = createCanvas(STONE_TILE_SIZE, STONE_TILE_SIZE);
  drawStonePattern(ctx, {
    rowHeight: 128,
    minBlockWidth: 128,
    maxBlockWidth: 128,
    staggered: false,
    mortar: '#9c8462',
    hue: 38,
    saturation: 32,
    lightness: 80,
    seed: 11,
  });
  return toTexture(canvas, repeatX, repeatY);
}

export function createFriezeTexture() {
  const { canvas, ctx } = createCanvas(512, 128);
  ctx.fillStyle = '#4a3420';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#d6ae5e';
  ctx.lineWidth = 4;
  for (let x = 0; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x + 8, 110);
    ctx.lineTo(x + 8, 62);
    ctx.arc(x + 32, 62, 24, Math.PI, 0);
    ctx.lineTo(x + 56, 110);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(512, 16);
  ctx.moveTo(0, 112);
  ctx.lineTo(512, 112);
  ctx.stroke();
  return toTexture(canvas, 23, 1);
}

export function createPlateTexture(label: string, fontSize = 64) {
  const width = 512;
  const height = 160;
  const { canvas, ctx } = createCanvas(width, height);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#d7b56a');
  gradient.addColorStop(1, '#8e6a2c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#4a3212';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.fillStyle = '#2b1d0e';
  ctx.font = `700 ${fontSize}px ${DISPLAY_FONT}`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2 + 4);
  return toTexture(canvas);
}

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxSize: number) {
  let size = maxSize;
  while (size > 40) {
    ctx.font = `700 ${size}px ${DISPLAY_FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

function drawArchMotif(ctx: CanvasRenderingContext2D, cx: number, baseY: number, radius: number, upward: boolean) {
  const start = upward ? Math.PI : 0;
  const end = upward ? 2 * Math.PI : Math.PI;
  ctx.beginPath();
  ctx.arc(cx, baseY, radius, start, end);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, baseY, radius * 0.66, start, end);
  ctx.stroke();
}

export function createPaintingTexture(name: string) {
  const width = 1024;
  const height = 1338;
  const { canvas, ctx } = createCanvas(width, height);

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#6b4a2a');
  background.addColorStop(0.55, '#3f2a18');
  background.addColorStop(1, '#241709');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, height * 0.45, 40, width / 2, height * 0.45, width * 0.7);
  glow.addColorStop(0, 'rgba(233,190,110,0.2)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#d6ae5e';
  ctx.lineWidth = 10;
  ctx.strokeRect(48, 48, width - 96, height - 96);
  ctx.lineWidth = 3;
  ctx.strokeRect(74, 74, width - 148, height - 148);

  ctx.lineWidth = 5;
  drawArchMotif(ctx, width / 2, 230, 110, true);
  drawArchMotif(ctx, width / 2, height - 230, 110, false);

  const isNicknamed = name.includes('—');
  let parts = isNicknamed ? name.split('—').map((part) => part.trim()) : [name];
  if (!isNicknamed && fitFontSize(ctx, name, 780, 120) < 88) {
    const words = name.split(' ');
    const middle = Math.ceil(words.length / 2);
    parts = [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
  }

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sizes = parts.map((part, index) => {
    const maxSize = index === 0 ? 120 : 84;
    return fitFontSize(ctx, part, 780, maxSize);
  });
  const lineGap = 24;
  const totalHeight = sizes.reduce((sum, size) => sum + size * 1.25, 0) + lineGap * (parts.length - 1);
  let cursorY = height / 2 - totalHeight / 2 + 40;

  parts.forEach((part, index) => {
    const size = sizes[index];
    const lineHeight = size * 1.25;
    ctx.font = `700 ${size}px ${DISPLAY_FONT}`;
    ctx.fillStyle = isNicknamed && index === 1 ? '#e7c27a' : '#fbf6ea';
    ctx.fillText(part, width / 2, cursorY + lineHeight / 2);
    cursorY += lineHeight + lineGap;
  });

  const ornamentY = cursorY + 36;
  ctx.strokeStyle = '#d6ae5e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 220, ornamentY);
  ctx.lineTo(width / 2 - 26, ornamentY);
  ctx.moveTo(width / 2 + 26, ornamentY);
  ctx.lineTo(width / 2 + 220, ornamentY);
  ctx.stroke();
  ctx.fillStyle = '#d6ae5e';
  ctx.beginPath();
  ctx.moveTo(width / 2, ornamentY - 14);
  ctx.lineTo(width / 2 + 14, ornamentY);
  ctx.lineTo(width / 2, ornamentY + 14);
  ctx.lineTo(width / 2 - 14, ornamentY);
  ctx.closePath();
  ctx.fill();

  return toTexture(canvas);
}
