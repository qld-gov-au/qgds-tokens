const StyleDictionary = require('style-dictionary');
const fs = require('fs');
const path = require('path');

// Register custom formats and transform groups as before

const PREFIX = 'qld';

// Register a custom format for SCSS variables with renaming
StyleDictionary.registerFormat({
  name: 'scss/variables-with-renaming',
  formatter: function({ dictionary }) {
    return dictionary.allProperties.map(prop => {
      // Rename the variable
      const name = prop.name.replace(/^core-default-color|color-default-color|core-status-color/, PREFIX);
      return `$${name}: ${prop.value};`;
    }).join('\n');
  }
});

// Register a custom format for SCSS map with renaming
StyleDictionary.registerFormat({
  name: 'scss/map-flat-with-renaming',
  formatter: function({ dictionary, options }) {
    const mapName = options.mapName || 'qld-tokens';
    return `$${mapName}: (\n${dictionary.allProperties.map(prop => {
      // Rename the variable
      const name = prop.name.replace(/^core-default-color|color-default-color|core-status-color/, PREFIX);
      return `  '${name}': ${prop.value}`;
    }).join(',\n')}\n);`;
  }
});

// Register a custom transform group
StyleDictionary.registerTransformGroup({
  name: 'scss-with-static',
  transforms: ['attribute/cti', 'name/cti/kebab']
});

// Extend Style Dictionary configuration and build all platforms
StyleDictionary.extend({
  source: ["figma/*.json"],
  platforms: {
    scss: {
      transformGroup: "scss-with-static",
      buildPath: "dist/scss/",
      files: [
        {
          destination: "_variables.scss",
          format: "scss/variables-with-renaming"
        },
        {
          destination: "_map.scss",
          format: "scss/map-flat-with-renaming",
          mapName: "qld-tokens"
        }
      ]
    }
  }
}).buildAllPlatforms();

// Function to copy files recursively
function copyFiles(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const items = fs.readdirSync(srcDir);

  items.forEach(item => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = fs.statSync(srcPath);

    if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    } else if (stat.isDirectory()) {
      copyFiles(srcPath, destPath);
    }
  });

  console.log(`Copied files from ${srcDir} to ${destDir}`);
}

// Copy resources to dist/assets after build
copyFiles('./resources', './dist/assets');
