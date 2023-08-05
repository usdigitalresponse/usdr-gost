# Styling

This app implements the [USDR Design System](https://www.figma.com/file/HWu4iIjcoX2txuN543qzIB/USDR-Design-System?type=design&node-id=101%3A167&mode=design&t=8mml86X91f9FzVAE-1), defined in Figma.

## Overview

This app is built with [Bootstrap Vue](https://bootstrap-vue.org/).

The implementation of the USDR design system primarily overrides Bootstrap's theme colors and fonts. Bootstrap provides a small set of [theme color definitions](https://getbootstrap.com/docs/5.0/customize/css-variables/#root-variables). This is the primary way the USDR brand is expressed in this app through Bootstrap.

These theme override definitions live in [custom.scss](../packages/client/scss/custom.scss).

## Using USDR styles in the app

If you need to provide additional styling to a component, please use [USDR design system semantic tokens](../packages/client/scss/colors-semantic-tokens.scss) wherever possible.

To import semantic token styles into your Vue component, please follow this pattern:
```vue
<style lang="scss">
  @import '../../scss/colors-semantic-tokens.scss';

  .my-class {
    color: $positive-accent;
  }
</style>
```

### Token System 
Colors are defined through a base and semantic token system.

#### Base Tokens
Base tokens define raw values for styles. For example, the USDR red base token color stack defines a gradient of red values in hex:
```scss
// RED
$raw-red-50: #FEF0EF;
$raw-red-100: #FDE5E3;
$raw-red-200: #FCCAC7;
$raw-red-300: #F8AFA9;
$raw-red-400: #ED8780;
$raw-red-500: #DC5B56;
$raw-red-600: #C22E31;
$raw-red-700: #A8161E;
$raw-red-800: #6D1210;
$raw-red-900: #4C110B;
```

#### Semantic Tokens
Semantic tokens pair a user context to a base color value. For example:
```scss
// NEGATIVE 
$negative-default: $raw-red-600;
$negative-hover: $raw-red-700;
$negative-active: $raw-red-800;
$negative-content: $raw-white;
$negative-accent: $raw-red-100;
$negative-accentContent: $raw-gray-700;
```

A set of semantic token definitions function as a *theme*. Multiple theme definitions may exist for the same set of semantic tokens, which allows implementation of alternate color themes like dark mode.  

*Please use semantic tokens wherever possible.* If you are required to use a base token for which there is no corresponding semantic token, please consult your designer. 

### Fonts

The fonts used in the USDR design system are:
- [Lora](https://fonts.google.com/specimen/Lora): heading font
- [Inter](https://fonts.google.com/specimen/Inter): body font

These font styles are implemented in [fonts.scss](../packages/clients/scss/fonts.scss).
