#!/usr/bin/env node
/**
 * 로고 PNG → WebP 변환 (헤더/푸터용)
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const conversions = [
  { input: '62DN_bk.png', output: 'logo-bk.webp' },
  { input: '62DN_wh.png', output: 'logo-wh.webp' },
];

for (const { input, output } of conversions) {
  const inputPath = path.join(publicDir, input);
  const outputPath = path.join(publicDir, output);
  try {
    await sharp(inputPath)
      .webp({ quality: 90 })
      .toFile(outputPath);
    console.log(`✓ ${input} → ${output}`);
  } catch (err) {
    if (err.code === 'ENOENT') console.warn(`⊘ ${input} 없음`);
    else throw err;
  }
}
console.log('로고 WebP 변환 완료.');
