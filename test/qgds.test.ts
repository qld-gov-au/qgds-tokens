import { promises } from "node:fs";
import path from 'node:path';

// test if input token exists
const jsonQGDSOutputDir = 'tokens';
const jsonQGDSOutputFileName = 'qgds.json';
const jsonQGDSOutputFilePath = path.resolve(jsonQGDSOutputDir, jsonQGDSOutputFileName);

// test if input token exists
const jsonTypographyOutputDir = 'tokens';
const jsonTypographyOutputFileName = 'typography.json';
const jsonTypographyOutputFilePath = path.resolve(jsonTypographyOutputDir, jsonTypographyOutputFileName);

// test if combined ouput token exists
const cssOutputDir = 'src/css/styles';
const cssOutputFileName = 'qgds.css';
const cssOutputFilePath = path.resolve(cssOutputDir, cssOutputFileName);

// test if input & output transformation is valid
const tokenTestObject = {
  "qgds": {
    "color": {"json": `color`, "css": `--qgds-color`},
  },
  "typography": {
    "phone": {
      "h1": {"json": `h1`, "css": `--typography-phone-h1`},
      "h2": {"json": `h2`, "css": `--typography-phone-h2`},
      "h3": {"json": `h3`, "css": `--typography-phone-h3`},
      "h4": {"json": `h4`, "css": `--typography-phone-h4`},
      "h5": {"json": `h5`, "css": `--typography-phone-h5`},
      "h6": {"json": `h6`, "css": `--typography-phone-h6`},
      "body": {"json": `body`, "css": `--typography-phone-body`},
      "sm": {"json": `sm`, "css": `--typography-phone-sm`},
      "xs": {"json": `xs`, "css": `--typography-phone-xs`},
    },
    "computer": {
      "h1": {"json": `h1`, "css": `--typography-computer-h1`},
      "h2": {"json": `h2`, "css": `--typography-computer-h2`},
      "h3": {"json": `h3`, "css": `--typography-computer-h3`},
      "h4": {"json": `h4`, "css": `--typography-computer-h4`},
      "h5": {"json": `h5`, "css": `--typography-computer-h5`},
      "h6": {"json": `h6`, "css": `--typography-computer-h6`},
      "body": {"json": `body`, "css": `--typography-computer-body`},
      "sm": {"json": `sm`, "css": `--typography-computer-sm`},
      "xs": {"json": `xs`, "css": `--typography-computer-xs`},
    }
  }
};

describe('qgds tests', () => {

  it('sanity - contains at least one: qgds in JSON file', async () => {
    const file = await promises.readFile(jsonQGDSOutputFilePath, 'utf-8');
    expect(file).toContain(`qgds`);
    expect(file).toContain(tokenTestObject.qgds.color.json);
  });

  it('sanity - contains at least one: typography in JSON file', async () => {
    const file = await promises.readFile(jsonTypographyOutputFilePath, 'utf-8');
    expect(file).toContain(`typography`);
    expect(file).toContain(tokenTestObject.typography.phone.h1.json);
    expect(file).toContain(tokenTestObject.typography.phone.h2.json);
    expect(file).toContain(tokenTestObject.typography.phone.h3.json);
    expect(file).toContain(tokenTestObject.typography.phone.h4.json);
    expect(file).toContain(tokenTestObject.typography.phone.h5.json);
    expect(file).toContain(tokenTestObject.typography.phone.h6.json);
    expect(file).toContain(tokenTestObject.typography.phone.body.json);
    expect(file).toContain(tokenTestObject.typography.phone.sm.json);
    expect(file).toContain(tokenTestObject.typography.phone.xs.json);
    expect(file).toContain(tokenTestObject.typography.computer.h1.json);
    expect(file).toContain(tokenTestObject.typography.computer.h2.json);
    expect(file).toContain(tokenTestObject.typography.computer.h3.json);
    expect(file).toContain(tokenTestObject.typography.computer.h4.json);
    expect(file).toContain(tokenTestObject.typography.computer.h5.json);
    expect(file).toContain(tokenTestObject.typography.computer.h6.json);
    expect(file).toContain(tokenTestObject.typography.computer.body.json);
    expect(file).toContain(tokenTestObject.typography.computer.sm.json);
    expect(file).toContain(tokenTestObject.typography.computer.xs.json);
  });

  it('sanity - contains at least one: qgds + typography in CSS file', async () => {
    const file = await promises.readFile(cssOutputFilePath, 'utf-8');
    // qgds tokens
    expect(file).toContain(tokenTestObject.qgds.color.css);
    // typography tokens
    expect(file).toContain(tokenTestObject.typography.phone.h1.json);
    expect(file).toContain(tokenTestObject.typography.phone.h2.json);
    expect(file).toContain(tokenTestObject.typography.phone.h3.json);
    expect(file).toContain(tokenTestObject.typography.phone.h4.json);
    expect(file).toContain(tokenTestObject.typography.phone.h5.json);
    expect(file).toContain(tokenTestObject.typography.phone.h6.json);
    expect(file).toContain(tokenTestObject.typography.phone.body.json);
    expect(file).toContain(tokenTestObject.typography.phone.sm.json);
    expect(file).toContain(tokenTestObject.typography.phone.xs.json);
    expect(file).toContain(tokenTestObject.typography.computer.h1.json);
    expect(file).toContain(tokenTestObject.typography.computer.h2.json);
    expect(file).toContain(tokenTestObject.typography.computer.h3.json);
    expect(file).toContain(tokenTestObject.typography.computer.h4.json);
    expect(file).toContain(tokenTestObject.typography.computer.h5.json);
    expect(file).toContain(tokenTestObject.typography.computer.h6.json);
    expect(file).toContain(tokenTestObject.typography.computer.body.json);
    expect(file).toContain(tokenTestObject.typography.computer.sm.json);
    expect(file).toContain(tokenTestObject.typography.computer.xs.json);
  });

});
