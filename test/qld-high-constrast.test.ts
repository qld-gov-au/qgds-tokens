import { promises } from "node:fs";
import path from 'node:path';

// test if input token exists
const jsonThemeOutputDir = 'tokens';
const jsonThemeOutputFileName = 'qld-high-contrast-theme.json';
const jsonThemeOutputFilePath = path.resolve(jsonThemeOutputDir, jsonThemeOutputFileName);

// test if input token exists
const jsonPalettesOutputDir = 'tokens';
const jsonPalettesOutputFileName = 'qld-high-contrast-palettes.json';
const jsonPalettesOutputFilePath = path.resolve(jsonPalettesOutputDir, jsonPalettesOutputFileName);

// test if combined ouput token exists
const cssOutputDir = 'src/css/styles';
const cssOutputFileName = 'qgds-qld-high-contrast-palettes.css';
const cssOutputFilePath = path.resolve(cssOutputDir, cssOutputFileName);

// test if input & output transformation is valid
const tokenTestObject = {
  "theme": {
    "color": {"json": `color`, "css": `--theme-color`},
    "focus": {"json": `focus`, "css": `--theme-focus`},
    "shadows": {"json": `shadows`, "css": `--theme-shadows`},
  },
  "palettes": {
    "bright": {"json": `bright`, "css": `--palettes-bright`},
    "tint": {"json": `tint`, "css": `--palettes-tint`},
    "alt": {"json": `alt`, "css": `--palettes-alt`},
    "bold": {"json": `bold`, "css": `--palettes-bold`},
    "strong": {"json": `strong`, "css": `--palettes-strong`},
    "dark": {"json": `dark`, "css": `--palettes-dark`},
  }
};

describe('qld-high-contrast tests', () => {

  it('sanity - contains at least one: theme in JSON file', async () => {
    const file = await promises.readFile(jsonThemeOutputFilePath, 'utf-8');
    expect(file).toContain(`theme`);
    expect(file).toContain(tokenTestObject.theme.color.json);
    expect(file).toContain(tokenTestObject.theme.focus.json);
    expect(file).toContain(tokenTestObject.theme.shadows.json);
  });

  it('sanity - contains at least one: palette-item in JSON file', async () => {
    const file = await promises.readFile(jsonPalettesOutputFilePath, 'utf-8');
    expect(file).toContain(`palettes`);
    expect(file).toContain(tokenTestObject.palettes.bright.json);
    expect(file).toContain(tokenTestObject.palettes.tint.json);
    expect(file).toContain(tokenTestObject.palettes.alt.json);
    expect(file).toContain(tokenTestObject.palettes.bold.json);
    expect(file).toContain(tokenTestObject.palettes.strong.json);
    expect(file).toContain(tokenTestObject.palettes.dark.json);
  });

  it('sanity - contains at least one: theme + palettes in CSS file', async () => {
    const file = await promises.readFile(cssOutputFilePath, 'utf-8');
    // theme tokens
    expect(file).toContain(tokenTestObject.theme.color.css);
    expect(file).toContain(tokenTestObject.theme.focus.css);
    expect(file).toContain(tokenTestObject.theme.shadows.css);
    // palettes tokens
    expect(file).toContain(tokenTestObject.palettes.bright.css);
    expect(file).toContain(tokenTestObject.palettes.tint.css);
    expect(file).toContain(tokenTestObject.palettes.alt.css);
    expect(file).toContain(tokenTestObject.palettes.bold.css);
    expect(file).toContain(tokenTestObject.palettes.strong.css);
    expect(file).toContain(tokenTestObject.palettes.dark.css);
  });

});
