import fs from "node:fs";
import sharp from "sharp";
// A queen's crown: three points with jewels over a band, champagne on night plum.
const crown = `<path d="M11 44 L6 19 L21.5 31 L32 11 L42.5 31 L58 19 L53 44 Z" fill="#f4dfb0"/>
<path d="M12 47 h40 a3.5 3.5 0 0 1 3.5 3.5 v2 a3.5 3.5 0 0 1 -3.5 3.5 h-40 a3.5 3.5 0 0 1 -3.5 -3.5 v-2 a3.5 3.5 0 0 1 3.5 -3.5 z" fill="#f4dfb0"/>
<circle cx="6" cy="19" r="3.4" fill="#d9b366"/><circle cx="32" cy="11" r="3.8" fill="#d9b366"/><circle cx="58" cy="19" r="3.4" fill="#d9b366"/>
<circle cx="32" cy="36" r="3.2" fill="#c6405f"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1a1120"/>${crown}</svg>`;
fs.writeFileSync("public/icon.svg", svg);
await sharp(Buffer.from(svg)).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(Buffer.from(svg)).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(process.argv[2] + "/crown-preview.png");
console.log("crown icons written");
