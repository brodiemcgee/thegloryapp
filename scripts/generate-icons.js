// Script to generate PWA icons from SVG
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(inputSvg);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}.png`);
  }

  // Also generate a badge icon for notifications (72x72)
  const badgePath = path.join(outputDir, 'badge-72.png');
  await sharp(svgBuffer)
    .resize(72, 72)
    .png()
    .toFile(badgePath);
  console.log('Generated: badge-72.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
