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
// GREEN
$raw-green-50: #DAFCE4;
$raw-green-100: #C5F6D4;
$raw-green-200: #9FE6B7;
$raw-green-300: #77D498;
$raw-green-400: #43B874;
$raw-green-500: #20975A;
$raw-green-600: #107747;
$raw-green-700: #15603F;
$raw-green-800: #173D2B;
$raw-green-900: #142B20;
```

#### Semantic Tokens
Semantic tokens pair a user context to a base color value. For example:
```scss
// POSITIVE
$positive-default: $raw-green-600;
$positive-hover: $raw-green-700;
$positive-active: $raw-green-800;
$positive-content: $raw-white;
$positive-accent: $raw-green-100;
$positive-accentContent: $raw-gray-700;
```

A set of semantic token definitions function as a *theme*. Multiple theme definitions may exist for the same set of semantic tokens, which allows implementation of alternate color themes like dark mode.  

*Please use semantic tokens wherever possible.* If you are required to use a base token for which there is no corresponding semantic token, please consult your designer. 

### Fonts

The fonts used in the USDR design system are:
- [Lora](https://fonts.google.com/specimen/Lora): heading font
- [Inter](https://fonts.google.com/specimen/Inter): body font

These font styles are implemented in [fonts.scss](../packages/client/scss/fonts.scss).
