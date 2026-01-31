#!/usr/bin/env node
/**
 * public 폴더의 히어로 이미지를 WebP로 변환
 * 사용: node scripts/convert-hero-to-webp.mjs
 */
import sharp from 'sharp';
import { readdir, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const conversions = [
  { input: '1-1.png', output: 'hero-one.webp' },
  { input: 'hero-two-hope-hearts.jpg', output: 'hero-two-hope-hearts.webp' },
  { input: 'hero-three-left-behind.jpg', output: 'hero-three-left-behind.webp' },
];

for (const { input, output } of conversions) {
  const inputPath = path.join(publicDir, input);
  const outputPath = path.join(publicDir, output);
  try {
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
    console.log(`✓ ${input} → ${output}`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`⊘ ${input} 없음, 건너뜀`);
    } else {
      throw err;
    }
  }
}

console.log('WebP 변환 완료.');
