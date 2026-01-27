import StyleDictionary from "style-dictionary";
import { getStyleDictionaryConfig } from "./sd.config";
import { BRANDS } from "./constants";
import { ValueFigmaColorToHexOrRGBA } from "./sd.transforms";

StyleDictionary.registerTransform(ValueFigmaColorToHexOrRGBA);
StyleDictionary.registerTransformGroup({
  name: "custom/scss",
  transforms: ["name/kebab", "ValueFigmaColorToHexOrRGBA"],
})

console.log("Build started...");

BRANDS.forEach(async (brand) => {
  console.log("\n==============================================");
  console.log(`\nProcessing: ${brand}`);

  const sd = new StyleDictionary(getStyleDictionaryConfig(brand));
  await sd.buildAllPlatforms();
});

console.log("\n==============================================");
console.log("\nBuild completed!");
