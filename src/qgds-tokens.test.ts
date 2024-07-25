import qgdsTokens from "./index";
import cssTokensGDDS from './css/styles/core.tokens.css';

test("works with JSON.stringify", () => {
  expect(qgdsTokens()).toBe(JSON.stringify(cssTokensGDDS));
});
