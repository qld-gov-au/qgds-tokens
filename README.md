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

## How to Extend Design Tokens? 
### How can I create my own set of Design Tokens?
You can create your own theme and extend all design tokens by forking this repo.
After forking please look at the example custom tokens and custom themes on the branch called: custom-tokens-and-themes-example
Run:
```bash
    git checkout custom-tokens-and-themes-example
```
All files you add/create into your forked version will be always safe from being overriden when you get latest from upstream (qgds-tokens).

### What files should I look for or change when creating your custom theme
Please add a reference of your new theme on $metadata.json and on $themes.json. Please see the example branch for more info: custom-tokens-and-themes-example

### What to do after I create a custom theme
Run:
```bash
    npm run build
    npm run test
    npm run build:package
```
You should see no errors.

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


