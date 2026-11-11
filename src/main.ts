import StyleDictionary from "style-dictionary";
import { getStyleDictionaryColorsConfig, getConfig } from "./sd.config";
import { BRANDS } from "./constants";
import { ValueFigmaColorToHexOrRGBA } from "./sd.transforms";

StyleDictionary.registerTransform(ValueFigmaColorToHexOrRGBA);
StyleDictionary.registerTransformGroup({
  name: "custom/scss",
  transforms: ["name/kebab", "ValueFigmaColorToHexOrRGBA"],
});

console.log("Build started...");

// BRANDS.forEach(async (brand) => {
//   console.log("\n==============================================");
//   console.log(`\nProcessing: ${brand}`);

//   const sd = new StyleDictionary(getStyleDictionaryColorsConfig(brand));
//   await sd.buildAllPlatforms();
// });

["Desktop", "Mobile"].forEach(async (device) => {
  const sd = new StyleDictionary(getConfig(device));
  await sd.buildAllPlatforms();
});

console.log("\n==============================================");
console.log("\nBuild completed!");
