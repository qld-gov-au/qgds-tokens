import { promises } from "node:fs";
import path from 'node:path';

// test if input token exists
const jsonQGDSOutputDir = 'tokens';
const jsonQGDSOutputFileName = 'qgds.tokens.json';
const jsonQGDSOutputFilePath = path.resolve(jsonQGDSOutputDir, jsonQGDSOutputFileName);

// test if input token exists
const jsonTypographyOutputDir = 'tokens';
const jsonTypographyOutputFileName = 'typography.tokens.json';
const jsonTypographyOutputFilePath = path.resolve(jsonTypographyOutputDir, jsonTypographyOutputFileName);

// test if combined ouput token exists
const cssOutputDir = 'src/css/styles';
const cssOutputFileName = 'qgds.tokens.css';
const cssOutputFilePath = path.resolve(cssOutputDir, cssOutputFileName);

// test if input & output transformation is valid
const tokenTestObject = {
  "qgds": {
    "colors": {"json": `colors`, "css": `--qgds-colors`},
  },
  "typography": {
    "h1": {"json": `h1`, "css": `--typography-h1`},
    "h2": {"json": `h2`, "css": `--typography-h2`},
    "h3": {"json": `h3`, "css": `--typography-h3`},
    "h4": {"json": `h4`, "css": `--typography-h4`},
    "h5": {"json": `h5`, "css": `--typography-h5`},
    "h6": {"json": `h6`, "css": `--typography-h6`},
    "body": {"json": `body`, "css": `--typography-body`},
    "sm": {"json": `sm`, "css": `--typography-sm`},
    "xs": {"json": `xs`, "css": `--typography-xs`},
  }
};

describe('qgds tests', () => {

  it('sanity - contains at least one: qgds in JSON file', async () => {
    const file = await promises.readFile(jsonQGDSOutputFilePath, 'utf-8');
    expect(file).toContain(`qgds`);
    expect(file).toContain(tokenTestObject.qgds.colors.json);
  });

  it('sanity - contains at least one: typography in JSON file', async () => {
    const file = await promises.readFile(jsonTypographyOutputFilePath, 'utf-8');
    expect(file).toContain(`typography`);
    expect(file).toContain(tokenTestObject.typography.h1.json);
    expect(file).toContain(tokenTestObject.typography.h2.json);
    expect(file).toContain(tokenTestObject.typography.h3.json);
    expect(file).toContain(tokenTestObject.typography.h4.json);
    expect(file).toContain(tokenTestObject.typography.h5.json);
    expect(file).toContain(tokenTestObject.typography.h6.json);
    expect(file).toContain(tokenTestObject.typography.body.json);
    expect(file).toContain(tokenTestObject.typography.sm.json);
    expect(file).toContain(tokenTestObject.typography.xs.json);
  });

  it('sanity - contains at least one: qgds + typography in CSS file', async () => {
    const file = await promises.readFile(cssOutputFilePath, 'utf-8');
    // qgds tokens
    expect(file).toContain(tokenTestObject.qgds.colors.css);
    // palettes tokens
    expect(file).toContain(tokenTestObject.typography.h1.css);
    expect(file).toContain(tokenTestObject.typography.h2.css);
    expect(file).toContain(tokenTestObject.typography.h3.css);
    expect(file).toContain(tokenTestObject.typography.h4.css);
    expect(file).toContain(tokenTestObject.typography.h5.css);
    expect(file).toContain(tokenTestObject.typography.h6.css);
    expect(file).toContain(tokenTestObject.typography.body.css);
    expect(file).toContain(tokenTestObject.typography.sm.css);
    expect(file).toContain(tokenTestObject.typography.xs.css);
  });

});
