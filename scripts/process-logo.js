import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processLogo() {
  const inputPath = path.resolve('public/assets/aistudio/images_dcff522a.png');
  const outWhite = path.resolve('public/nexus-logo.png');
  const outBlack = path.resolve('public/nexus-logo-black.png');

  console.log('Loading image from', inputPath);
  const metadata = await sharp(inputPath).metadata();
  console.log('Image dimensions:', metadata.width, metadata.height);

  // First crop out watermark (ignore bottom 20%)
  const cropHeight = Math.floor((metadata.height || 300) * 0.82);
  const cropped = await sharp(inputPath)
    .extract({
      left: 0,
      top: 0,
      width: metadata.width || 300,
      height: cropHeight,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = cropped;
  const { width, height, channels } = info;

  // Let's create two RGBA buffers: one black on transparent, one white on transparent
  const blackBuffer = Buffer.alloc(width * height * 4);
  const whiteBuffer = Buffer.alloc(width * height * 4);

  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Luminosity (0 = black, 255 = white)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const targetIdx = (y * width + x) * 4;

      // Inverted luminosity becomes alpha: 0 lum -> 255 alpha; 255 lum -> 0 alpha
      // Apply smoothstep / threshold curve to eliminate off-white noise
      let alpha = 0;
      if (lum < 235) {
        // Range 0..235 mapped to 255..0
        const factor = Math.max(0, Math.min(1, (235 - lum) / 180));
        // Smooth curve
        alpha = Math.round(Math.pow(factor, 1.2) * 255);
      }

      if (alpha > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      // Black text on transparent
      blackBuffer[targetIdx] = 0;
      blackBuffer[targetIdx + 1] = 0;
      blackBuffer[targetIdx + 2] = 0;
      blackBuffer[targetIdx + 3] = alpha;

      // Pure White text on transparent (for dark UI)
      whiteBuffer[targetIdx] = 255;
      whiteBuffer[targetIdx + 1] = 255;
      whiteBuffer[targetIdx + 2] = 255;
      whiteBuffer[targetIdx + 3] = alpha;
    }
  }

  // Add small padding around bounding box
  const pad = 12;
  const boxX = Math.max(0, minX - pad);
  const boxY = Math.max(0, minY - pad);
  const boxW = Math.min(width - boxX, (maxX - minX) + pad * 2);
  const boxH = Math.min(height - boxY, (maxY - minY) + pad * 2);

  console.log(`Bounding box: x=${boxX}, y=${boxY}, w=${boxW}, h=${boxH}`);

  // Save trimmed white version
  await sharp(whiteBuffer, { raw: { width, height, channels: 4 } })
    .extract({ left: boxX, top: boxY, width: boxW, height: boxH })
    .resize(600, null, { kernel: 'lanczos3' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outWhite);

  // Save trimmed black version
  await sharp(blackBuffer, { raw: { width, height, channels: 4 } })
    .extract({ left: boxX, top: boxY, width: boxW, height: boxH })
    .resize(600, null, { kernel: 'lanczos3' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outBlack);

  console.log('Successfully generated transparent logos:');
  console.log('->', outWhite);
  console.log('->', outBlack);
}

processLogo().catch(console.error);
