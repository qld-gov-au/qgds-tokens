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
  "spacing": {"json": `spacing`, "css": `--spacing`},
  "borderRadius": {"json": `borderRadius`, "css": `--border-radius`},
  "color": {"json": `color`, "css": `--color`},
  "opacity": {"json": `opacity`, "css": `--opacity`},
  "transparency": {"json": `transparency`, "css": `--transparency`},
  "focus": {"json": `focus`, "css": `--focus`},
  "fontFamily": {"json": `fontFamily`, "css": `--font-family`},
  "lineHeight": {"json": `lineHeight`, "css": `--line-height`},
  "letterSpacing": {"json": `letterSpacing`, "css": `--letter-spacing`},
  "paragraphSpacing": {"json": `paragraphSpacing`, "css": `--paragraph-spacing`},
  "fontSize": {"json": `fontSize`, "css": `--font-size`},
  "textDecoration": {"json": `textDecoration`, "css": `--text-decoration`},
};

describe('primitive tests', () => {

  it('sanity - contains all primitive high key values in JSON file', async () => {
    const file = await promises.readFile(jsonOutputFilePath, 'utf-8');
    expect(file).toContain(tokenTestObject.spacing.json);
    expect(file).toContain(tokenTestObject.borderRadius.json);
    expect(file).toContain(tokenTestObject.color.json);
    expect(file).toContain(tokenTestObject.opacity.json);
    expect(file).toContain(tokenTestObject.transparency.json);
    expect(file).toContain(tokenTestObject.focus.json);
    expect(file).toContain(tokenTestObject.fontFamily.json);
    expect(file).toContain(tokenTestObject.lineHeight.json);
    expect(file).toContain(tokenTestObject.letterSpacing.json);
    expect(file).toContain(tokenTestObject.paragraphSpacing.json);
    expect(file).toContain(tokenTestObject.fontSize.json);
    expect(file).toContain(tokenTestObject.textDecoration.json);
  });

  it('sanity - contains at least one primitive high key values in CSS file', async () => {
    const file = await promises.readFile(cssOutputFilePath, 'utf-8');
    expect(file).toContain(tokenTestObject.spacing.css);
    expect(file).toContain(tokenTestObject.borderRadius.css);
    expect(file).toContain(tokenTestObject.color.css);
    expect(file).toContain(tokenTestObject.opacity.css);
    expect(file).toContain(tokenTestObject.transparency.css);
    expect(file).toContain(tokenTestObject.focus.css);
    expect(file).toContain(tokenTestObject.fontFamily.css);
    expect(file).toContain(tokenTestObject.lineHeight.css);
    expect(file).toContain(tokenTestObject.letterSpacing.css);
    expect(file).toContain(tokenTestObject.paragraphSpacing.css);
    expect(file).toContain(tokenTestObject.fontSize.css);
    expect(file).toContain(tokenTestObject.textDecoration.css);
  });

});
