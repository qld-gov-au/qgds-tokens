// filters only tokens originating from primitive.json
export const primitiveFilter = (token) => token.filePath.endsWith("primitive.tokens.json");

// filters only tokens originating from semantic sets (not primitive, not components) and also check themeable or not
export const semanticFilter =
  (components, themeable = false) =>
  (token) => {
    const tokenThemable = Boolean(token.attributes.themeable);
    return (
      themeable === tokenThemable &&
      ["primitive", ...components].every(
        (cat) => !token.filePath.endsWith(`${cat}.tokens.json`)
      )
    );
  };
// filters tokens by themable and from which tokenset they originate
// must match per component name, in this repository we currently only have "button"
export const componentFilter =
  (cat, themeable = false) =>
  (token) => {
    const tokenThemable = Boolean(token.attributes.themeable);
    return (
      themeable === tokenThemable && token.filePath.endsWith(`${cat}.tokens.json`)
    );
  };
