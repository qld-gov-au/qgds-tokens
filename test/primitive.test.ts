import { promises } from "node:fs";
import path from 'node:path';

// test if input token exists
const jsonOutputDir = 'tokens';
const jsonOutputFileName = 'primitive.tokens.json';
const jsonOutputFilePath = path.resolve(jsonOutputDir, jsonOutputFileName);

// test if ouput token exists
const cssOutputDir = 'src/css/styles';
const cssOutputFileName = 'primitive.tokens.css';
const cssOutputFilePath = path.resolve(cssOutputDir, cssOutputFileName);

// test if input & output transformation is valid
const tokenTestObject = {
  "dimension": {"json": `dimension`, "css": `--dimension`},
  "spacing": {"json": `spacing`, "css": `--spacing`},
  "borderRadius": {"json": `borderRadius`, "css": `--border-radius`},
  "colors": {"json": `colors`, "css": `--colors`},
  "opacity": {"json": `opacity`, "css": `--opacity`},
  "transparency": {"json": `transparency`, "css": `--transparency`},
  "focus": {"json": `focus`, "css": `--focus`},
  "fontFamilies": {"json": `fontFamilies`, "css": `--font-families`},
  "lineHeights": {"json": `lineHeights`, "css": `--line-heights`},
  "letterSpacing": {"json": `letterSpacing`, "css": `--letter-spacing`},
  "paragraphSpacing": {"json": `paragraphSpacing`, "css": `--paragraph-spacing`},
  "fontSizes": {"json": `fontSizes`, "css": `--font-sizes`},
  "textDecorations": {"json": `textDecorations`, "css": `--text-decorations`},
};

describe('primitive tests', () => {

  it('sanity - contains all primitive high key values in JSON file', async () => {
    const file = await promises.readFile(jsonOutputFilePath, 'utf-8');
    expect(file).toContain(tokenTestObject.dimension.json);
    expect(file).toContain(tokenTestObject.spacing.json);
    expect(file).toContain(tokenTestObject.borderRadius.json);
    expect(file).toContain(tokenTestObject.colors.json);
    expect(file).toContain(tokenTestObject.opacity.json);
    expect(file).toContain(tokenTestObject.transparency.json);
    expect(file).toContain(tokenTestObject.focus.json);
    expect(file).toContain(tokenTestObject.fontFamilies.json);
    expect(file).toContain(tokenTestObject.lineHeights.json);
    expect(file).toContain(tokenTestObject.letterSpacing.json);
    expect(file).toContain(tokenTestObject.paragraphSpacing.json);
    expect(file).toContain(tokenTestObject.fontSizes.json);
    expect(file).toContain(tokenTestObject.textDecorations.json);
  });

  it('sanity - contains at least one primitive high key values in CSS file', async () => {
    const file = await promises.readFile(cssOutputFilePath, 'utf-8');
    expect(file).toContain(tokenTestObject.dimension.css);
    expect(file).toContain(tokenTestObject.spacing.css);
    expect(file).toContain(tokenTestObject.borderRadius.css);
    expect(file).toContain(tokenTestObject.colors.css);
    expect(file).toContain(tokenTestObject.opacity.css);
    expect(file).toContain(tokenTestObject.transparency.css);
    expect(file).toContain(tokenTestObject.focus.css);
    expect(file).toContain(tokenTestObject.fontFamilies.css);
    expect(file).toContain(tokenTestObject.lineHeights.css);
    expect(file).toContain(tokenTestObject.letterSpacing.css);
    expect(file).toContain(tokenTestObject.paragraphSpacing.css);
    expect(file).toContain(tokenTestObject.fontSizes.css);
    expect(file).toContain(tokenTestObject.textDecorations.css);
  });

});
