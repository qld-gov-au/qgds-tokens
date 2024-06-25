const StyleDictionary = require('style-dictionary');

const PREFIX = 'qld';

// Register a custom format for SCSS variables with renaming
StyleDictionary.registerFormat({
  name: 'scss/variables-with-renaming',
  formatter: function({ dictionary }) {
    return dictionary.allProperties.map(prop => {
      // Rename the variable
      const name = prop.name.replace(/^core-default-color|color-default-color/, PREFIX);
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
      const name = prop.name.replace(/^core-default-color|color-default-color/, PREFIX);
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
