# Luma Color Palette - OKLCH Format

## Overview

Colors extracted from Luma's default event page, converted to OKLCH format for use in modern CSS. OKLCH provides perceptually uniform color spaces and better interpolation than RGB.

## Base Colors

### Primary Background/Surface Colors

```css
/* Light background - rgb(243, 245, 247) */
--color-bg-light: oklch(96.5% 0.005 240);

/* White - rgb(255, 255, 255) */
--color-white: oklch(100% 0 0);

/* Dark text/foreground - rgb(13, 21, 28) */
--color-text-dark: oklch(9% 0.015 240);

/* Medium text - rgb(66, 73, 79) */
--color-text-medium: oklch(32% 0.01 240);

/* Muted text - rgb(105, 115, 125) */
--color-text-muted: oklch(49% 0.015 240);

/* Subtle gray - rgb(149, 149, 149) */
--color-gray: oklch(64% 0 0);
```

### Accent Colors

```css
/* Pink/Magenta accent - rgb(243, 26, 124) */
--color-accent-pink: oklch(59% 0.24 340);

/* Purple accent - rgb(110, 47, 227) */
--color-accent-purple: oklch(49% 0.22 285);

/* Blue accent - rgb(12, 171, 247) */
--color-accent-blue: oklch(68% 0.17 235);

/* Orange accent - rgb(248, 113, 43) */
--color-accent-orange: oklch(68% 0.18 45);

/* Orange-red - rgb(226, 116, 23) */
--color-accent-orange-red: oklch(64% 0.17 50);

/* Green - rgb(31, 111, 5) */
--color-accent-green: oklch(45% 0.15 140);
```

## Alpha/Opacity Variants

### Dark Text Opacity Variants (rgb(13, 21, 28))

```css
/* Transparent - rgba(13, 21, 28, 0) */
--color-dark-transparent: oklch(9% 0.015 240 / 0);

/* Very subtle - rgba(13, 21, 28, 0.04) */
--color-dark-subtle: oklch(9% 0.015 240 / 0.04);

/* Subtle border - rgba(13, 21, 28, 0.08) */
--color-dark-border: oklch(9% 0.015 240 / 0.08);

/* Medium subtle - rgba(13, 21, 28, 0.32) */
--color-dark-medium: oklch(9% 0.015 240 / 0.32);

/* Secondary text - rgba(13, 21, 28, 0.36) */
--color-dark-secondary: oklch(9% 0.015 240 / 0.36);

/* Disabled - rgba(13, 21, 28, 0.48) */
--color-dark-disabled: oklch(9% 0.015 240 / 0.48);

/* Primary text - rgba(13, 21, 28, 0.64) */
--color-dark-primary: oklch(9% 0.015 240 / 0.64);
```

### Alternative Dark (rgb(19, 21, 23))

```css
/* Very subtle - rgba(19, 21, 23, 0.04) */
--color-dark-alt-subtle: oklch(10% 0.01 240 / 0.04);

/* Secondary - rgba(19, 21, 23, 0.36) */
--color-dark-alt-secondary: oklch(10% 0.01 240 / 0.36);

/* Primary - rgba(19, 21, 23, 0.64) */
--color-dark-alt-primary: oklch(10% 0.01 240 / 0.64);
```

### White Opacity Variants

```css
/* White low opacity - rgba(255, 255, 255, 0.16) */
--color-white-low: oklch(100% 0 0 / 0.16);

/* White medium - rgba(255, 255, 255, 0.32) */
--color-white-medium: oklch(100% 0 0 / 0.32);

/* White high - rgba(255, 255, 255, 0.48) */
--color-white-high: oklch(100% 0 0 / 0.48);
```

### Muted Color Variants

```css
/* Muted subtle - rgba(105, 115, 125, 0.13) */
--color-muted-subtle: oklch(49% 0.015 240 / 0.13);

/* Medium dark overlay - rgba(66, 73, 79, 0.8) */
--color-medium-overlay: oklch(32% 0.01 240 / 0.8);

/* Gray subtle - rgba(42, 46, 51, 0.04) */
--color-gray-subtle: oklch(20% 0.01 240 / 0.04);
```

### Black/Transparent Variants

```css
/* Fully transparent - rgba(0, 0, 0, 0) */
--color-transparent: oklch(0% 0 0 / 0);

/* Black subtle shadow - rgba(0, 0, 0, 0.1) */
--color-shadow-subtle: oklch(0% 0 0 / 0.1);
```

## Semantic Token Mapping

### For DayOf Implementation

```css
/* Light mode semantic tokens */
:root {
  /* Backgrounds */
  --page-bg: var(--color-bg-light);
  --card-bg: var(--color-white);

  /* Text */
  --text-primary: var(--color-dark-primary);
  --text-secondary: var(--color-dark-secondary);
  --text-muted: var(--color-text-muted);
  --text-disabled: var(--color-dark-disabled);

  /* Borders */
  --border-subtle: var(--color-dark-subtle);
  --border-default: var(--color-dark-border);

  /* Brand/Accent (customize per event) */
  --brand-primary: var(--color-accent-purple);
  --brand-secondary: var(--color-accent-pink);

  /* Interactive states */
  --hover-bg: var(--color-dark-subtle);
  --active-bg: var(--color-dark-border);
}

/* Dark mode semantic tokens */
.dark {
  /* Backgrounds */
  --page-bg: var(--color-text-dark);
  --card-bg: var(--color-text-medium);

  /* Text */
  --text-primary: var(--color-white);
  --text-secondary: var(--color-white-high);
  --text-muted: var(--color-text-muted);

  /* Borders */
  --border-subtle: var(--color-white-low);
  --border-default: var(--color-white-medium);

  /* Interactive states */
  --hover-bg: var(--color-white-low);
  --active-bg: var(--color-white-medium);
}
```

## Tailwind v4 Integration

Add to `apps/frontrow/src/index.css`:

```css
@theme inline {
  /* Base colors */
  --color-bg-light: oklch(96.5% 0.005 240);
  --color-white: oklch(100% 0 0);
  --color-text-dark: oklch(9% 0.015 240);
  --color-text-medium: oklch(32% 0.01 240);
  --color-text-muted: oklch(49% 0.015 240);
  --color-gray: oklch(64% 0 0);

  /* Accent colors */
  --color-accent-pink: oklch(59% 0.24 340);
  --color-accent-purple: oklch(49% 0.22 285);
  --color-accent-blue: oklch(68% 0.17 235);
  --color-accent-orange: oklch(68% 0.18 45);
  --color-accent-green: oklch(45% 0.15 140);

  /* Alpha variants - define base, use Tailwind opacity modifiers */
  --color-dark-base: oklch(9% 0.015 240);
  --color-white-base: oklch(100% 0 0);
}

/* Usage in components */
.example {
  /* Use Tailwind opacity modifiers instead of pre-defined alpha variants */
  background: var(--color-dark-base) / 0.04;
  color: var(--color-dark-base) / 0.64;
  border-color: var(--color-white-base) / 0.16;
}
```

## Usage Examples

### Glassmorphism Card

```css
.card-glass {
  background: var(--color-white) / 0.8;
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-dark-base) / 0.08;
}
```

### Button States

```css
.button-primary {
  background: var(--color-accent-purple);
  color: var(--color-white);
}

.button-primary:hover {
  background: oklch(from var(--color-accent-purple) calc(l * 0.9) c h);
}

.button-primary:active {
  background: oklch(from var(--color-accent-purple) calc(l * 0.8) c h);
}
```

### Text Hierarchy

```css
.text-primary {
  color: var(--color-dark-base) / 0.64;
}

.text-secondary {
  color: var(--color-dark-base) / 0.36;
}

.text-muted {
  color: var(--color-text-muted);
}
```

## RGB to OKLCH Conversion Reference

For quick reference, here are the original RGB values:

| Color Name    | RGB                  | OKLCH                    |
| ------------- | -------------------- | ------------------------ |
| Light BG      | `rgb(243, 245, 247)` | `oklch(96.5% 0.005 240)` |
| Dark Text     | `rgb(13, 21, 28)`    | `oklch(9% 0.015 240)`    |
| Medium Text   | `rgb(66, 73, 79)`    | `oklch(32% 0.01 240)`    |
| Muted Text    | `rgb(105, 115, 125)` | `oklch(49% 0.015 240)`   |
| Pink Accent   | `rgb(243, 26, 124)`  | `oklch(59% 0.24 340)`    |
| Purple Accent | `rgb(110, 47, 227)`  | `oklch(49% 0.22 285)`    |
| Blue Accent   | `rgb(12, 171, 247)`  | `oklch(68% 0.17 235)`    |
| Orange Accent | `rgb(248, 113, 43)`  | `oklch(68% 0.18 45)`     |
| Green Accent  | `rgb(31, 111, 5)`    | `oklch(45% 0.15 140)`    |

## Notes

1. **OKLCH Format**: `oklch(Lightness% Chroma Hue / Alpha)`

   - Lightness: 0-100%
   - Chroma: 0-0.4 (typically)
   - Hue: 0-360 degrees
   - Alpha: 0-1 (optional)

2. **Perceptual Uniformity**: OKLCH provides consistent perceived brightness across hues, unlike RGB/HSL

3. **Modern Browsers**: Supported in Chrome 111+, Safari 15.4+, Firefox 113+

4. **Fallbacks**: Use PostCSS OKLCH plugin or provide RGB fallbacks for older browsers

5. **Dynamic Color Manipulation**: Use `oklch(from var(--color) calc(l * 1.2) c h)` for programmatic adjustments

6. **Chroma Values**: Lower chroma (0-0.02) = grays, higher (0.2-0.3) = vibrant colors

7. **Hue Ranges**:
   - Red: 0-30°
   - Orange: 30-70°
   - Yellow: 70-120°
   - Green: 120-180°
   - Blue: 180-270°
   - Purple: 270-330°
   - Pink/Magenta: 330-360°
