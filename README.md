# Style Dictionary (QGDS Tokens)
*Style once, use everywhere.*
>
> "A Style Dictionary uses design tokens to define styles once and use those styles on any platform or language. It provides a single place to create and edit your styles, and exports these tokens to all the places you need." - Amazon


## Setup:

### Using this repository:
1. Figma variables are exported to ./figma/tokens.json 
2. Run:
```bash 
    npm run build-tokens
``` 

### Verify outputs
```bash
   npm run test
```

### CI
```bash
   npm run ci
```

## Publish system

There is two publish subsystems, one is to npmjs and the other is to github repo package

### Github package repository

 Still work in progress:
 * currently missing cleanup prior to publishing latest tag
 * needs to publish when a version is cut (including incrementing package.json version if not same)
