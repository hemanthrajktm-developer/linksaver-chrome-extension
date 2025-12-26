const fs = require('fs');

// Create a simple base64 encoded PNG for each size
// This is a minimal blue square with "LV" text

const createSimpleIcon = (size) => {
  // Simple base64 encoded PNG data for a blue square with white text
  // This is a placeholder - in production you'd want proper icons
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size/8}" fill="#007AFF"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${size/3}" font-weight="bold">🔗</text>
  </svg>`;
  
  return canvas;
};

// Create SVG files for each size (browsers can handle SVG icons)
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const svgContent = createSimpleIcon(size);
  fs.writeFileSync(`icons/icon${size}.svg`, svgContent);
  console.log(`Created icon${size}.svg`);
});

console.log('Icon generation complete!');
console.log('Note: For production, convert these SVGs to PNG files or use proper icon design tools.');