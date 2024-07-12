import { semanticFilter, componentFilter } from "./sd-filters.js";

const commonFileOptions = {
  format: "css/variables",
  options: {
    selector: ":host",
  },
};

export const generateSemanticFiles = (components, theme, platform) => {
  const filesArr = [];
  // theme-specific outputs
  filesArr.push({
    ...commonFileOptions,
    filter: semanticFilter(components, true),
    destination: `src/${platform}/styles/qgds-${theme.toLowerCase()}.${platform}`,
  });

  // not theme-specific outputs
  filesArr.push({
    ...commonFileOptions,
    filter: semanticFilter(components, false),
    destination: `src/${platform}/styles/qgds.${platform}`,
  });

  return filesArr;
};

// for each component (currently only button), filter those specific component tokens and output them
// to the component folder where the component source code will live
export const generateComponentFiles = (components, theme, platform) => {
  const filesArr = [];

  for (const comp of components) {
    // theme-specific outputs
    filesArr.push({
      ...commonFileOptions,
      filter: componentFilter(comp, true),
      destination: `src/${platform}/${comp}/${comp}-${theme.toLowerCase()}.${platform}`,
    });

    // not theme-specific outputs
    filesArr.push({
      ...commonFileOptions,
      filter: componentFilter(comp, false),
      destination: `src/${platform}/${comp}/${comp}.${platform}`,
    });
  }
  return filesArr;
};
