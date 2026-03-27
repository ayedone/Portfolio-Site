const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, 'projects');
const MAX_W = 1600; // max width — plenty for a gallery viewer
const JPEG_Q = 82;  // jpeg quality
const PNG_Q  = 80;  // png quality (for images that must stay png)
const PNG_SIZE_THRESHOLD = 500 * 1024; // only compress PNGs over 500KB

async function compressFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const origKB = Math.round(stat.size / 1024);

  // Skip tiny files
  if (stat.size < 100 * 1024) {
    console.log(`  SKIP  ${path.relative(__dirname, filePath)} (${origKB}KB — already small)`);
    return;
  }

  const tmpPath = filePath + '.tmp';

  try {
    let pipeline = sharp(filePath).rotate(); // auto-rotate from EXIF

    // Resize if wider than MAX_W
    const meta = await sharp(filePath).metadata();
    if (meta.width > MAX_W) pipeline = pipeline.resize(MAX_W, null, { withoutEnlargement: true });

    if (ext === '.png' && stat.size < PNG_SIZE_THRESHOLD) {
      console.log(`  SKIP  ${path.relative(__dirname, filePath)} (${origKB}KB PNG — under threshold)`);
      return;
    }

    if (ext === '.png') {
      // Convert large PNGs → JPEG (huge savings for photos/designs)
      const jpgPath = filePath.replace(/\.png$/i, '.jpg');
      await pipeline.jpeg({ quality: JPEG_Q, mozjpeg: true }).toFile(tmpPath);
      const newKB = Math.round(fs.statSync(tmpPath).size / 1024);
      fs.renameSync(tmpPath, jpgPath);
      fs.unlinkSync(filePath);
      console.log(`  PNG→JPG  ${path.relative(__dirname, filePath)} → ${origKB}KB → ${newKB}KB  (saved ${Math.round((1-newKB/origKB)*100)}%)`);
    } else {
      await pipeline.jpeg({ quality: JPEG_Q, mozjpeg: true }).toFile(tmpPath);
      const newKB = Math.round(fs.statSync(tmpPath).size / 1024);
      fs.renameSync(tmpPath, filePath);
      console.log(`  JPG  ${path.relative(__dirname, filePath)}  ${origKB}KB → ${newKB}KB  (saved ${Math.round((1-newKB/origKB)*100)}%)`);
    }
  } catch (e) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error(`  ERR  ${filePath}: ${e.message}`);
  }
}

async function run() {
  const files = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(jpg|jpeg|png)$/i.test(f)) files.push(full);
    }
  }
  walk(PROJECTS_DIR);

  console.log(`Compressing ${files.length} images...\n`);
  for (const f of files) await compressFile(f);
  console.log('\nDone!');
}

run();
