import StyleDictionary from "style-dictionary";
import config from "./sd.config";

(async () => {
  const sd = new StyleDictionary(config);
  await sd.buildAllPlatforms();
})();
