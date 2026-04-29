const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'public', 'images');

async function compress() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png'));
  
  for (const file of files) {
    const input = path.join(DIR, file);
    const name = path.parse(file).name;
    const output = path.join(DIR, name + '.webp');
    
    const origSize = fs.statSync(input).size;
    
    await sharp(input)
      .webp({ quality: 85, effort: 6 })
      .toFile(output);
    
    const newSize = fs.statSync(output).size;
    const saved = ((1 - newSize / origSize) * 100).toFixed(1);
    
    console.log(`${file} -> ${name}.webp | ${(origSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB (${saved}% smaller)`);
  }
  console.log('\nDone! All images compressed to WebP.');
}

compress().catch(console.error);
