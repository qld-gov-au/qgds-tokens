import type StyleDictionary from 'style-dictionary';
import { expect } from 'chai';
import { promises } from 'node:fs';
import path from 'node:path';

const outputDir = 'test/tokens/';
const outputFileName = 'primitive.css';
const outputFilePath = path.resolve(outputDir, outputFileName);

const cfg = {
  source: ['test/tokens/primitive.tokens.json'],
  preprocessors: ['tokens-studio'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      prefix: 'sd',
      buildPath: outputDir,
      files: [
        {
          destination: outputFileName,
          format: 'css/variables',
        },
      ],
    },
  },
};

let dict: StyleDictionary | undefined;

describe('sd-transforms smoke tests', () => {

  it('supports tokens-studio tokens', async () => {
    const file = await promises.readFile(outputFilePath, 'utf-8');
    expect(file).to.include(`:root {
  --sdDimensionScale: 2;
  --sdDimensionXs: 4px;
  --sdDimensionSm: 8px;
  --sdDimensionMd: 16px;
  --sdDimensionLg: 32px;
  --sdDimensionXl: 64px;
  --sdOpacity: 0.25;
  --sdSpacingSm: 8px;
  --sdSpacingXl: 64px;
  --sdSpacingMultiValue: 8px 64px; /* You can have multiple values in a single spacing token. Read more on these: https://docs.tokens.studio/available-tokens/spacing-tokens#multi-value-spacing-tokens */
  --sdColorsBlack: #000000;
  --sdColorsWhite: #ffffff;
  --sdColorsBlue: #0000ff;
  --sdColorsBlueAlpha: rgba(0, 0, 255, 50%);
  --sdColorsRed400: #f67474;
  --sdColorsRed500: #f56565;
  --sdColorsRed600: #dd5b5b;
  --sdColorsGradient: linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0.00) 45%);
  --sdLineHeightsHeading: 1.1;
  --sdLineHeightsBody: 1.4;
  --sdLetterSpacingDefault: 0rem;
  --sdLetterSpacingIncreased: 1.5em;
  --sdLetterSpacingDecreased: -0.05em;
  --sdFontWeightsHeadingRegular: 600;
  --sdFontWeightsHeadingBold: 700;
  --sdFontWeightsBodyRegular: 400;
  --sdFontSizesH6: 16px;
  --sdFontSizesBody: 16px;
  --sdHeading6: 700 16px/1 'Arial Black', 'Suisse Int\\'l', sans-serif;
  --sdShadowBlur: 10px;
  --sdShadow: inset 0 4px 10px 0 rgba(0,0,0,0.4);
  --sdBorderWidth: 5px;
  --sdBorder: 5px solid #000000;
  --sdColor: #ff00ff;
  --sdUsesColor: rgba(255, 0, 255, 1);
}`);
  });
});
