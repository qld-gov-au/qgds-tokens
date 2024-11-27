# Queensland Government Design System
# Design Tokens
## (qgds-tokens)
*Style once, use everywhere.*
>
> "A Style Dictionary uses design tokens to define styles once and use those styles on any platform or language. It provides a single place to create and edit your styles, and exports these tokens to all the places you need." - Amazon

## Setup:

### Using this repository:
Run:
```bash
    npm run build
```

### Verify outputs
```bash
   npm run test
```

### CI
```bash
   npm run ci
```

## The Usage of Tokens Studio
Using Tokens Studio to update tokens directly from Figma is welcomed.
Sometimes, Tokens Studio may change or add $metadata and $theme tokens that had already been defined.
In case this happens, we've added *.original to assist you in reverting back to how build-tokens is expecting these files to be configured.

## About Tokens Sudio
https://docs.tokens.studio

## About Style Dictionary
https://github.com/amzn/style-dictionary

## About Style Dictionary Transforms for Tokens Studio
https://github.com/tokens-studio/sd-transforms

## Publish system
There is two publish subsystems, one is to npmjs and the other is to github repo package

### Github package repository
 Still work in progress:
 * currently missing cleanup prior to publishing latest tag
 * needs to publish when a version is cut (including incrementing package.json version if not same)
