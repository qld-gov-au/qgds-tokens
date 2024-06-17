const StyleDictionary = require('style-dictionary');

// Register a custom format for SCSS variables
StyleDictionary.registerFormat({
  name: 'scss/variables-with-renaming',
  formatter: function({ dictionary }) {
    return dictionary.allProperties.map(prop => {
      // Rename the variable
      const name = prop.name.replace(/^core-default-color|color-default-color/, 'qld');
      return `$${name}: ${prop.value};`;
    }).join('\n');
  }
});

// Register a custom format for SCSS map
StyleDictionary.registerFormat({
  name: 'scss/map-flat-with-renaming',
  formatter: function({ dictionary, options }) {
    return `$${options.mapName}: (\n${dictionary.allProperties.map(prop => {
      // Rename the variable
      const name = prop.name.replace(/^core-default-color|color-default-color/, 'qld');
      return `  '${name}': ${prop.value}`;
    }).join(',\n')}\n);`;
  }
});

const staticVariables = {
  "core-default-color-status-caution-default": "#ffcc2c",
  "core-default-color-status-caution-darker": "#B38800",
  "core-default-color-status-caution-lighter": "#fff2c9",
  "core-default-color-status-caution-lightest": "#fffaea",
  "core-default-color-status-info-default": "#0085b3",
  "core-default-color-status-info-darker": "#006a8f",
  "core-default-color-status-info-lighter": "#e5eef5",
  "core-default-color-status-info-lightest": "#eff4f9",
  "core-default-color-status-error-default": "#e22339",
  "core-default-color-status-error-darker": "#8a1220",
  "core-default-color-status-error-lighter": "#fdf0f0",
  "core-default-color-status-error-lightest": "#fff6f6",
  "core-default-color-status-success-default": "#339d37",
  "core-default-color-status-success-darker": "#0a690d",
  "core-default-color-status-success-lighter": "#f2faf4",
  "core-default-color-status-success-lightest": "#f7fbf8",
  "core-default-color-status-underline-light": "#ffffffb8",
  "core-default-color-status-underline-dark": "#03213fb8"
};

// Merge static variables into the dictionary
StyleDictionary.registerTransform({
  name: 'merge-static-variables',
  type: 'value',
  transformer: (prop) => {
    const key = prop.path.join('-');
    return staticVariables[key] || prop.value;
  }
});

// Register the custom transformGroup to include our transform
StyleDictionary.registerTransformGroup({
  name: 'scss-with-static',
  transforms: StyleDictionary.transformGroup['scss'].concat(['merge-static-variables'])
});

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
