#!/usr/bin/env node
/**
 * 성공 후기 섹션용 이미지 3장 다운로드 후 WebP 변환
 * 1: 강아지 입양 / 2: 고양이 입양 / 3: 고양이(루나) 입양
 */
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const images = [
  {
    url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
    out: 'success-story-1.webp',
    desc: '강아지 입양 - 가족과 함께',
  },
  {
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
    out: 'success-story-2.webp',
    desc: '고양이 입양',
  },
  {
    url: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600',
    out: 'success-story-3.webp',
    desc: '고양이 입양 (루나)',
  },
];

await mkdir(publicDir, { recursive: true });

for (const { url, out, desc } of images) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const outPath = path.join(publicDir, out);
    await sharp(buf)
      .webp({ quality: 82 })
      .toFile(outPath);
    console.log(`✓ ${desc} → ${out}`);
  } catch (err) {
    console.error(`✗ ${out}:`, err.message);
  }
}

console.log('성공 후기 이미지 WebP 생성 완료.');
