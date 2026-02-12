const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../src/content/blog');
const HERO_IMAGE_PATH = '../../assets/blog/hero-images';

function updateHeroImage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const slug = path.basename(filePath, '.md');
  const heroImagePath = `${HERO_IMAGE_PATH}/${slug}.jpg`;

  // Check if heroImage already exists
  if (content.includes('heroImage:')) {
    // Replace existing heroImage
    const updated = content.replace(
      /heroImage:.*$/m,
      `heroImage: ${heroImagePath}`
    );
    fs.writeFileSync(filePath, updated);
    return { updated: true, existed: true };
  }

  // Find the line with "---" to end frontmatter and insert before it
  const lines = content.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---' && i > 0) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex > 0) {
    lines.splice(insertIndex, 0, `heroImage: ${heroImagePath}`);
    const updated = lines.join('\n');
    fs.writeFileSync(filePath, updated);
    return { updated: true, existed: false };
  }

  return { updated: false, existed: false };
}

function main() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const results = {
    updated: 0,
    alreadyHad: 0,
    failed: []
  };

  files.forEach(file => {
    const filePath = path.join(BLOG_DIR, file);
    try {
      const result = updateHeroImage(filePath);
      if (result.updated) {
        if (result.existed) {
          results.alreadyHad++;
        } else {
          results.updated++;
        }
        console.log(`✓ ${file}`);
      } else {
        results.failed.push(file);
        console.log(`✗ Failed: ${file}`);
      }
    } catch (err) {
      results.failed.push(file);
      console.log(`✗ Error: ${file} - ${err.message}`);
    }
  });

  console.log('\n=== Summary ===');
  console.log(`Total files: ${files.length}`);
  console.log(`Added heroImage: ${results.updated}`);
  console.log(`Updated existing: ${results.alreadyHad}`);
  console.log(`Total updated: ${results.updated + results.alreadyHad}`);
  if (results.failed.length > 0) {
    console.log(`Failed: ${results.failed.length}`);
    results.failed.forEach(f => console.log(`  - ${f}`));
  }
}

main();
