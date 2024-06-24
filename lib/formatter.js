/** 
 * Only run if updating icons.svg file - see documentation 
 * To do: documentation
*/
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

fs.readFile('./icon-lib.svg', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const dom = new JSDOM(data);
  const document = dom.window.document;

  const svg = document.querySelector('svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('role', 'img');
  svg.setAttribute('focusable', 'false');

  // Remove any child <g> element with id="icon-lib" and move its children to the parent <svg>
  const iconLibGroup = document.querySelector('g[id="icon-lib"]');
  while (iconLibGroup.firstChild) {
    svg.appendChild(iconLibGroup.firstChild);
  }
  iconLibGroup.remove();

  // Add the prefix 'qld__icon__' in front of existing IDs and viewBox attribute to each <g> element
  const groups = document.querySelectorAll('g');
  groups.forEach(group => {
    const id = group.getAttribute('id');
    group.setAttribute('id', `qld__icon__${id}`);
    group.setAttribute('viewBox', '0 0 512 512'); // Adjust viewBox size if needed
  });

  // Swap any fill="#hexcolor" with fill="currentColor"
  const paths = document.querySelectorAll('path');
  paths.forEach(path => {
    const fill = path.getAttribute('fill');
    if (fill && fill.startsWith('#')) {
      path.setAttribute('fill', 'currentColor');
    }
    // Remove id attribute from path elements
    path.removeAttribute('id');
  });

  const result = svg.outerHTML;

  fs.writeFile('../dist/assets/icon-lib.svg', result, 'utf8', err => {
    if (err) {
      console.error(err);
    } else {
      console.log('SVG processed and saved successfully.');
    }
  });
});


