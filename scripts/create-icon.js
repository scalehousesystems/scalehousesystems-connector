const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon() {
  const buildDir = path.join(__dirname, '../build');
  
  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Create a simple gradient image with "SH" text
  const svg = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="40" fill="url(#gradient)"/>
      <text x="128" y="150" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">SH</text>
      <circle cx="200" cy="56" r="24" fill="#10b981"/>
      <text x="200" y="65" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">✓</text>
    </svg>
  `;

  // Generate PNG at 256x256
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(256, 256)
    .png()
    .toBuffer();

  // Save as PNG first
  const pngPath = path.join(buildDir, 'icon.png');
  fs.writeFileSync(pngPath, pngBuffer);
  console.log('Created icon.png');

  // For ICO, we'll use a simple approach: create multiple sizes
  const sizes = [256, 128, 64, 48, 32, 16];
  
  for (const size of sizes) {
    const resized = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    
    const sizePath = path.join(buildDir, `icon-${size}.png`);
    fs.writeFileSync(sizePath, resized);
  }

  console.log('Created icon PNGs at multiple sizes');
  console.log('Note: You may want to use an online ICO converter or ImageMagick to create the final .ico file');
  console.log('For now, we will use the 256x256 PNG renamed as .ico (electron-builder can handle this)');

  // Copy the main PNG as ICO (electron-builder will handle it)
  const icoPath = path.join(buildDir, 'icon.ico');
  fs.copyFileSync(pngPath, icoPath);
  console.log('Created icon.ico');
}

createIcon().catch(console.error);
