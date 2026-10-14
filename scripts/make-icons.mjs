// Generates the PWA PNG icons from the SVG logo. Run once: node scripts/make-icons.mjs
import sharp from 'sharp';

const logo = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${32 + 2 * pad} ${32 + 2 * pad}">
<rect x="${-pad}" y="${-pad}" width="${32 + 2 * pad}" height="${32 + 2 * pad}" fill="#0b8573"/>
<rect width="32" height="32" rx="8" fill="#0b8573"/><path d="M6 17c4-6 11-7 16-2l4-3v10l-4-3c-5 5-12 4-16-2z" fill="#fff"/><circle cx="11" cy="16" r="1.4" fill="#0b8573"/></svg>`;

await sharp(Buffer.from(logo(0))).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(Buffer.from(logo(0))).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(Buffer.from(logo(6))).resize(512, 512).png().toFile('public/icon-maskable-512.png');
await sharp(Buffer.from(logo(0))).resize(180, 180).png().toFile('app/apple-icon.png');
console.log('icons written');
