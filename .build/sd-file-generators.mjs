import { semanticFilter, componentFilter } from "./sd-filters.mjs";

const commonFileOptions = {
  android: {
    format: "android/resources",
  },
  js: {
    format: "javascript/es6",
  },
  scss: {
    format: "scss/variables",
    options: {
      selector: ":root",
    },
  },
  css: {
    format: "css/variables",
    options: {
      selector: ":root",
    },
  }
};

export const generateSemanticFiles = (components, theme, platform, fileExtension) => {
  const filesArr = [];
  // theme-specific outputs
  filesArr.push({
    ...commonFileOptions[platform],
    filter: semanticFilter(components, true),
    destination: `src/${platform}/styles/${theme.toLowerCase()}.${fileExtension}`,
  });

  // no theme-specific outputs
  filesArr.push({
    ...commonFileOptions[platform],
    filter: semanticFilter(components, false),
    destination: `src/${platform}/styles/qgds.${fileExtension}`,
  });

  return filesArr;
};

// for each component (currently only button and card), filter those specific component tokens and output them
// to the component folder where the component source code will live
export const generateComponentFiles = (components, theme, platform, fileExtension) => {
  const filesArr = [];

  for (const comp of components) {
    // theme-specific outputs
    filesArr.push({
      ...commonFileOptions[platform],
      filter: componentFilter(comp, true),
      destination: `src/${platform}/${comp}/${comp}-${theme.toLowerCase()}.${fileExtension}`,
    });

    // no theme-specific outputs
    filesArr.push({
      ...commonFileOptions[platform],
      filter: componentFilter(comp, false),
      destination: `src/${platform}/${comp}/${comp}.${fileExtension}`,
    });
  }
  return filesArr;
};
