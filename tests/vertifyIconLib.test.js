const { JSDOM } = require('jsdom');
const fs = require('fs');

// Read the SVG file
const svgData = fs.readFileSync('./dist/assets/icon-lib.svg', 'utf8');

describe('SVG Icon Children Test', () => {
  let document;

  beforeAll(() => {
    // Parse the SVG data using JSDOM
    const dom = new JSDOM(svgData);
    document = dom.window.document;
  });

  test('should have the correct number of icon children', () => {
    // Select all <g> elements with an id that starts with 'qld__icon__'
    const iconGroups = document.querySelectorAll('g[id^="qld__icon__"]');
    
    // Check if the number of icon groups is correct
    expect(iconGroups.length).toBe(6);
  });
});
