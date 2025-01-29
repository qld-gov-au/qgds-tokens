import { promises } from "node:fs";
import path from 'node:path';

// test if input token exists
const jsonThemeOutputDir = 'tokens';
const jsonThemeOutputFileName = 'qld-corporate-theme.json';
const jsonThemeOutputFilePath = path.resolve(jsonThemeOutputDir, jsonThemeOutputFileName);

// test if input token exists
const jsonPaletteOutputDir = 'tokens';
const jsonPaletteOutputFileName = 'qld-corporate-palette.json';
const jsonPaletteOutputFilePath = path.resolve(jsonPaletteOutputDir, jsonPaletteOutputFileName);

// test if combined ouput token exists
const cssOutputDir = 'src/css/styles';
const cssOutputFileName = 'qld-corporate-palette.css';
const cssOutputFilePath = path.resolve(cssOutputDir, cssOutputFileName);

// test if input & output transformation is valid
const tokenTestObject = {
  "theme": {
    "color": {"json": `color`, "css": `--theme-color`},
    "focus": {"json": `focus`, "css": `--theme-focus`},
    "shadows": {"json": `shadows`, "css": `--theme-shadows`},
  },
  "palette": {
    "bright": {"json": `bright`, "css": `--palette-bright`},
    "tint": {"json": `tint`, "css": `--palette-tint`},
    "alt": {"json": `alt`, "css": `--palette-alt`},
    "bold": {"json": `bold`, "css": `--palette-bold`},
    "strong": {"json": `strong`, "css": `--palette-strong`},
    "dark": {"json": `dark`, "css": `--palette-dark`},
  }
};

describe('qld-corporate tests', () => {

  it('sanity - contains at least one: theme in JSON file', async () => {
    const file = await promises.readFile(jsonThemeOutputFilePath, 'utf-8');
    expect(file).toContain(`theme`);
    expect(file).toContain(tokenTestObject.theme.color.json);
    expect(file).toContain(tokenTestObject.theme.focus.json);
    expect(file).toContain(tokenTestObject.theme.shadows.json);
  });

  it('sanity - contains at least one: palette-item in JSON file', async () => {
    const file = await promises.readFile(jsonPaletteOutputFilePath, 'utf-8');
    expect(file).toContain(`palette`);
    expect(file).toContain(tokenTestObject.palette.bright.json);
    expect(file).toContain(tokenTestObject.palette.tint.json);
    expect(file).toContain(tokenTestObject.palette.alt.json);
    expect(file).toContain(tokenTestObject.palette.bold.json);
    expect(file).toContain(tokenTestObject.palette.strong.json);
    expect(file).toContain(tokenTestObject.palette.dark.json);
  });

  it('sanity - contains at least one: theme + palette in CSS file', async () => {
    const file = await promises.readFile(cssOutputFilePath, 'utf-8');
    // theme tokens
    expect(file).toContain(tokenTestObject.theme.color.css);
    expect(file).toContain(tokenTestObject.theme.focus.css);
    expect(file).toContain(tokenTestObject.theme.shadows.css);
    // palette tokens
    expect(file).toContain(tokenTestObject.palette.bright.css);
    expect(file).toContain(tokenTestObject.palette.tint.css);
    expect(file).toContain(tokenTestObject.palette.alt.css);
    expect(file).toContain(tokenTestObject.palette.bold.css);
    expect(file).toContain(tokenTestObject.palette.strong.css);
    expect(file).toContain(tokenTestObject.palette.dark.css);
  });

});
