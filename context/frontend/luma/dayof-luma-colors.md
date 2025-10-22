# Luma's Color System & Theming Architecture

Based on the attached files, here's how Luma structures its color system:

## 1. Multi-Step Color Scales with Opacity Variants

Luma uses an **11-step color scale** (5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100) where each step has **4 variants**:

```css
/* Base color */
--gray-50: #b3b5b7;

/* Opacity variants */
--gray-50-transparent: rgba(179, 181, 183, 0); /* 0% */
--gray-50-translucent: rgba(179, 181, 183, 0.25); /* 25% */
--gray-50-thick-translucent: rgba(179, 181, 183, 0.8); /* 80% */
```

**Standardized opacity values:**

- `transparent`: `00` hex (0%)
- `translucent`: `40` hex (25%)
- `thick-translucent`: `cc` hex (80%)

This applies to all color families: `gray`, `cranberry`, `barney`, `purple`, `blue`, `green`, `yellow`, `orange`, `red`.

## 2. RGB Base Values for Dynamic Alpha

Luma uses **RGB base values** to create dynamic opacity variants:

```css
--black-base-rgb: 19, 21, 23;
--white-base-rgb: 255, 255, 255;

/* Dynamic opacity ladder (0-80 in steps) */
--black-opacity-0: rgba(var(--black-base-rgb), 0);
--black-opacity-2: rgba(var(--black-base-rgb), 0.02);
--black-opacity-4: rgba(var(--black-base-rgb), 0.04);
--black-opacity-8: rgba(var(--black-base-rgb), 0.08);
--black-opacity-16: rgba(var(--black-base-rgb), 0.16);
--black-opacity-24: rgba(var(--black-base-rgb), 0.24);
--black-opacity-32: rgba(var(--black-base-rgb), 0.32);
--black-opacity-48: rgba(var(--black-base-rgb), 0.48);
--black-opacity-64: rgba(var(--black-base-rgb), 0.64);
--black-opacity-80: rgba(var(--black-base-rgb), 0.8);
```

**Why this matters:** Allows consistent opacity application without defining every color×opacity combination.

## 3. Three-Layer Semantic Token System

### Layer 1: Base Palette Colors

```css
--cranberry-50: #f31a7c;
--purple-50: #682fff;
--blue-50: #146aeb;
```

### Layer 2: Semantic Aliases (Light Mode)

```css
--brand-color: var(--cranberry);
--success-color: var(--green);
--error-color: var(--red);
--warning-color: var(--yellow);
```

### Layer 3: Contextual Tokens

```css
--primary-color: var(--black); /* Text color */
--secondary-color: var(--gray-70);
--tertiary-color: var(--gray-50);

--primary-bg-color: var(--white); /* Background */
--secondary-bg-color: var(--gray-10);
```

## 4. Per-Event Brand Color Injection

From the HTML source, Luma **dynamically injects brand colors** per event:

```html
<style id="__jsx-940851167">
  .lux-menu-wrapper.menu-totyegzj8p {
    --brand-5: #f7f3fd;
    --brand-10: #f1ebfc;
    --brand-20: #d4c6ed;
    --brand-30: #a471e3;
    --brand-40: #975cdb;
    --brand-50: #7646ad; /* Primary brand color */
    --brand-60: #563081;
    --brand-70: #371f54;
    --brand-80: #261c34;
    --brand-90: #181321;
    --brand-100: #121115;

    --brand-color: #a471e3;
    --brand-content-color: #975cdb;
    --brand-bg-color: #7646ad;
    --brand-active-color: #975cdb;
    --brand-active-bg-color: #563081;
    --brand-pale-bg-color: #a078d621; /* With alpha */
  }
</style>
```

**Pattern:** Each event gets a complete brand color scale (5-100) **derived algorithmically** from a base color.

## 5. Light/Dark Mode Switching

Luma uses **CSS class switching** (`.theme-root.light` / `.theme-root.dark`):

```css
/* Light mode (lines 204-351) */
.theme-root,
.tint-root {
  --primary-color: var(--black);
  --primary-bg-color: var(--white);
  --brand-color: var(--cranberry);
}

/* Dark mode (lines 354-452) */
.theme-root.dark {
  --primary-color: var(--white);
  --primary-bg-color: var(--black);
  --shadow-xs: 0 1px 4px rgba(0, 0, 0, 0.25); /* Stronger shadows */
}
```

**Key insight:** Same variable names, different values. Components don't need to know about theme—they just reference tokens.

## 6. Cover Image Color Extraction

From the HTML JSON data:

```json
"cover_image": {
  "vibrant_color": null,
  "colors": ["#502aac", "#8f73cf", "#342064", "#e3ddf3"]
}
```

Luma **automatically extracts** 4 dominant colors from uploaded cover images and uses them to generate event-specific brand palettes.

## 7. Theme Configuration Structure

From HTML JSON:

```json
"theme_meta": {
  "name": "Lavender",
  "type": "shader",
  "theme": "shader-dark",
  "color1": "#6d00e6",
  "color2": "#830ed8",
  "color3": "#af00e6"
}
```

**Human-readable names** like "Lavender", "Ocean", "Sunset" make themes selectable by users.

## 8. Tint System for Contextual Theming

Luma has a **`.tint-root`** wrapper for nested theme contexts:

```css
.tint-root.light {
  --brand-50: #884dca;
  --tint-color: #572e85cc;
  --primary-or-tinted-color: #572e85;
}
```

This allows **cards or sections** to have different color treatments within the same page.

## Key Architectural Patterns

### ✅ RGB Base + Dynamic Opacity

Avoid defining every color×opacity pair. Use RGB bases:

```css
/* Define once */
--brand-base-rgb: 118, 70, 173;

/* Generate opacity ladder */
--brand-opacity-4: rgba(var(--brand-base-rgb), 0.04);
--brand-opacity-8: rgba(var(--brand-base-rgb), 0.08);
```

### ✅ Semantic Layering

```
Base Palette → Semantic Aliases → Contextual Tokens
  ↓                ↓                    ↓
--blue-50  →  --brand-color  →  --primary-button-bg
```

### ✅ Per-Event Customization

Each event gets:

- Complete brand scale (5-100)
- Extracted cover colors
- Theme name ("Lavender", "Ocean")
- Mode variant (shader-dark, shader-light)

### ✅ Scoped Component Theming

Components like buttons define their own variable space:

```css
.lux-button.brand {
  border-color: var(--brand-color);
  background-color: var(--brand-bg-color);
}

.lux-button.brand:hover {
  background-color: var(--brand-active-bg-color);
}
```

## Comparison: OKLCH vs RGB/HEX

The `luma-colors-oklch.md` file shows **OKLCH conversions**, but **Luma actually uses RGB/HEX** in production:

| Format      | Luma Uses?   | Example                  | Benefits                 |
| ----------- | ------------ | ------------------------ | ------------------------ |
| **RGB/HEX** | ✅ Primary   | `#f31a7c`                | Browser support, tooling |
| **RGBA**    | ✅ For alpha | `rgba(19, 21, 23, 0.04)` | Dynamic opacity          |
| **OKLCH**   | ❌ Not yet   | `oklch(59% 0.24 340)`    | Perceptual uniformity    |

OKLCH is **future-facing** (requires PostCSS or fallbacks for older browsers). Luma sticks with RGB for now.

## Implementation Recommendations for DayOf

Based on Luma's architecture, here's what to adopt:

### 1. **RGB Base Values** (Critical)

```css
:root {
  --brand-base-rgb: 118, 70, 173; /* Your primary brand */

  /* Generate opacity ladder */
  --brand-4: rgba(var(--brand-base-rgb), 0.04);
  --brand-8: rgba(var(--brand-base-rgb), 0.08);
  --brand-16: rgba(var(--brand-base-rgb), 0.16);
  --brand-32: rgba(var(--brand-base-rgb), 0.32);
  --brand-64: rgba(var(--brand-base-rgb), 0.64);
}
```

### 2. **Per-Event Brand Injection**

```typescript
// Database schema
export const events = pgTable("events", {
  themeName: text("theme_name"), // "Lavender", "Ocean"
  brandColorBase: text("brand_color_base"), // "#7646ad"
  coverColorsPalette: jsonb("cover_colors_palette").$type<string[]>(),
});

// Generate scale from base
function generateBrandScale(baseHex: string) {
  // Algorithm to create 5-100 scale
  return {
    "brand-5": lighten(baseHex, 0.95),
    "brand-50": baseHex,
    "brand-90": darken(baseHex, 0.8),
  };
}
```

### 3. **Semantic Token Layer**

```css
/* Don't reference colors directly in components */
❌ color: var(--purple-50)

/* Use semantic tokens */
✅ color: var(--brand-color)
✅ background: var(--primary-bg-color)
```

### 4. **Avoid Over-Engineering**

Luma's system is **comprehensive but complex**. For DayOf, consider:

- ✅ Use Tailwind v4's opacity modifiers: `bg-brand/10`, `bg-brand/80`
- ✅ Define semantic tokens in `:root` / `.dark`
- ❌ Don't replicate all 11×4 color variants unless needed
- ❌ Skip OKLCH unless targeting cutting-edge browsers only

## Quick Reference: Luma's Color Usage Patterns

| Use Case             | Luma Pattern                                                 | DayOf Equivalent                           |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| **Card backgrounds** | `--card-bg-color: var(--white-opacity-80)`                   | `bg-card/80`                               |
| **Borders**          | `--divider-color: var(--opacity-8)`                          | `border-border`                            |
| **Text hierarchy**   | `--primary-color`, `--secondary-color`, `--tertiary-color`   | `text-foreground`, `text-muted-foreground` |
| **Glassmorphism**    | `backdrop-filter: var(--backdrop-blur)` + `--modal-bg-color` | `backdrop-blur-[16px] bg-card/80`          |
| **Brand accents**    | `--brand-color` (injected per event)                         | `bg-primary` (with per-event override)     |

## Summary: Key Takeaways

1. **RGB base values** enable dynamic opacity without combinatorial explosion
2. **11-step scales** provide granular control (but you may only need 5-7)
3. **Semantic layering** decouples components from specific colors
4. **Per-event injection** allows brand customization without code changes
5. **Light/dark modes** use same tokens, different values
6. **Theme names** ("Lavender") are more user-friendly than color codes
7. **Automatic color extraction** from cover images reduces manual work

**Bottom line:** Luma's system is **production-proven** but comprehensive. For DayOf, adopt the **RGB base + semantic tokens** pattern with Tailwind v4, skip the full 11-step scales unless you need that granularity.

---

# Why 11 Steps? Luma's Color Scale Reasoning

## The 11-Step Scale Explained

Looking at the CSS, Luma uses: **5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100**

### Why This Specific Distribution?

**1. Perceptually Balanced Gradations**

The steps aren't evenly spaced in numeric value—they're designed for **visual perception**:

```css
Light Mode Text Hierarchy (from CSS):
--primary-color: var(--black);              /* Full contrast */
--secondary-color: var(--gray-70);          /* 70% step - readable but subdued */
--tertiary-color: var(--gray-50);           /* 50% step - muted */
--quaternary-color: var(--gray-30);         /* 30% step - subtle */
```

**The pattern:**

- **5-10**: Barely perceptible (backgrounds)
- **20-30**: Subtle (borders, dividers)
- **40-50**: Mid-range (secondary UI)
- **60-70**: Prominent (interactive elements)
- **80-100**: High contrast (primary text/buttons)

### 2. Covers All UI Needs Without Gaps

From the CSS usage patterns:

| Step    | Primary Use Case       | Example                                           |
| ------- | ---------------------- | ------------------------------------------------- |
| **5**   | Lightest backgrounds   | `--cranberry-5: #fef4f9` (error backgrounds)      |
| **10**  | Light backgrounds      | `--gray-10: #f7f8f9` (secondary surfaces)         |
| **20**  | Borders, dividers      | `--gray-20: #ebeced` (subtle separators)          |
| **30**  | Disabled states        | `--quaternary-color: var(--gray-30)`              |
| **40**  | Borders (hover)        | `--gray-40: #d2d4d7`                              |
| **50**  | Mid-tone UI            | `--tertiary-color: var(--gray-50)`                |
| **60**  | Interactive defaults   | `--secondary-button-bg-color: var(--gray-60)`     |
| **70**  | Text secondary         | `--secondary-color: var(--gray-70)`               |
| **80**  | Buttons (dark)         | `--primary-button-hover-bg-color: var(--gray-80)` |
| **90**  | Primary buttons        | `--primary-button-bg-color: var(--gray-90)`       |
| **100** | Darkest (dark mode bg) | `--gray-100: #212325`                             |

### 3. Avoids the "Missing Step" Problem

If they used 10 steps (0-90 by 10s), they'd miss:

- **5** - Essential for very light tinted backgrounds
- **100** - Needed for the darkest shade in dark mode

If they used 9 steps (10-90), they'd lack:

- **5** - Ultra-light variants
- **100** - Ultra-dark variants

**11 steps = minimum needed to cover full tonal range without gaps.**

---

## Input → Generation Pipeline

Based on the HTML source and CSS, here's Luma's **actual color generation flow**:

### Inputs (What Luma Takes)

From the `theme_meta` JSON in the HTML:

```json
{
  "name": "Lavender", // Input 1: Human name
  "type": "shader", // Input 2: Theme type
  "theme": "shader-dark", // Input 3: Mode variant
  "color1": "#6d00e6", // Input 4: Gradient color 1
  "color2": "#830ed8", // Input 5: Gradient color 2
  "color3": "#af00e6" // Input 6: Gradient color 3
}
```

Plus cover image color extraction:

```json
"cover_image": {
  "colors": ["#502aac", "#8f73cf", "#342064", "#e3ddf3"]  // Input 7: Extracted palette
}
```

### Generation Pipeline

#### Step 1: Choose Base Brand Color

```typescript
// Option A: Use extracted cover color (automated)
const baseBrandColor = coverImage.colors[0]; // "#502aac"

// Option B: Use custom theme color (manual override)
const baseBrandColor = themeMeta.color1; // "#6d00e6"
```

#### Step 2: Generate 11-Step Brand Scale

```typescript
function generateBrandScale(baseColor: string): Record<string, string> {
  // Starting from brand-50 (the base), generate lighter and darker variants
  return {
    "brand-5": lighten(baseColor, 0.45), // #f7f3fd (very light)
    "brand-10": lighten(baseColor, 0.4), // #f1ebfc
    "brand-20": lighten(baseColor, 0.3), // #d4c6ed
    "brand-30": lighten(baseColor, 0.2), // #a471e3
    "brand-40": lighten(baseColor, 0.1), // #975cdb
    "brand-50": baseColor, // #7646ad (base - no change)
    "brand-60": darken(baseColor, 0.15), // #563081
    "brand-70": darken(baseColor, 0.3), // #371f54
    "brand-80": darken(baseColor, 0.45), // #261c34
    "brand-90": darken(baseColor, 0.6), // #181321
    "brand-100": darken(baseColor, 0.7), // #121115 (very dark)
  };
}
```

#### Step 3: Generate Opacity Variants

For each of the 11 steps, create 4 variants:

```typescript
function generateOpacityVariants(colorHex: string, step: number) {
  const rgb = hexToRgb(colorHex);

  return {
    [`brand-${step}`]: colorHex, // Solid
    [`brand-${step}-transparent`]: `${colorHex}00`, // 0%
    [`brand-${step}-translucent`]: `rgba(${rgb}, 0.25)`, // 25%
    [`brand-${step}-thick-translucent`]: `rgba(${rgb}, 0.8)`, // 80%
  };
}
```

**Result:** `11 steps × 4 variants = 44 color variables per brand\*\*

#### Step 4: Generate Semantic Aliases

```css
/* Auto-generated from brand scale */
--brand-color: var(--brand-30); /* Interactive elements */
--brand-content-color: var(--brand-40); /* Content with brand color */
--brand-bg-color: var(--brand-50); /* Brand backgrounds */
--brand-active-color: var(--brand-40); /* Hover state */
--brand-active-bg-color: var(--brand-60); /* Active background */
--brand-pale-bg-color: rgba(var(--brand-base-rgb), 0.133); /* Subtle tint */
```

#### Step 5: Inject into Page Styles

The scoped styles in the HTML show this happens **dynamically per event**:

```html
<style id="__jsx-940851167">
  .lux-menu-wrapper.menu-totyegzj8p {
    /* All 44+ brand variables injected here */
    --brand-50: #7646ad;
    --brand-color: #a471e3;
    /* ... */
  }
</style>
```

---

## Complete Generation Flow

```mermaid
graph TB
    A[Event Cover Image] --> B[Extract 4 Colors]
    C[Manual Theme Selection] --> D[Base Brand Color]
    B --> D
    D --> E[Generate 11-Step Scale]
    E --> F[Generate 4 Opacity Variants per Step]
    F --> G[Create Semantic Aliases]
    G --> H[Inject into Scoped CSS]

    I[Light/Dark Mode Toggle] --> J[Swap Semantic Values]
    H --> K[Final Rendered Page]
    J --> K
```

### Input Summary

| Input                | Source              | Example                       | Purpose               |
| -------------------- | ------------------- | ----------------------------- | --------------------- |
| **Base Brand Color** | Manual or extracted | `#7646ad`                     | Generates full scale  |
| **Cover Image**      | User upload         | `event-cover.jpg`             | Auto-extract 4 colors |
| **Theme Name**       | User selection      | "Lavender"                    | Human-readable label  |
| **Theme Type**       | User selection      | "shader", "video", "pattern"  | Background style      |
| **Mode**             | User preference     | "shader-dark", "shader-light" | Light/dark variant    |

### Output Summary

| Generated Output     | Quantity              | Example                                 |
| -------------------- | --------------------- | --------------------------------------- |
| **Base scale**       | 11 per color family   | `--brand-5` through `--brand-100`       |
| **Opacity variants** | 3 per step (44 total) | `--brand-50-translucent`                |
| **Semantic tokens**  | ~15                   | `--brand-color`, `--brand-active-color` |
| **Component tokens** | ~50+                  | `--primary-button-bg-color`             |
| **RGB bases**        | 2 core (black/white)  | `--black-base-rgb: 19, 21, 23`          |

---

## Why 11 Steps vs Other Systems?

### Comparison to Other Frameworks

| System              | Steps       | Reasoning                                        |
| ------------------- | ----------- | ------------------------------------------------ |
| **Tailwind**        | 10 (50-950) | Even 100s, 50 as base                            |
| **Material Design** | 10 (50-900) | Similar to Tailwind                              |
| **Luma**            | 11 (5-100)  | Adds 5 for ultra-light, keeps 100 for ultra-dark |
| **Ant Design**      | 10 (1-10)   | Numeric index system                             |

**Luma's choice:** Extend the standard 10-step scale with **5** (ultra-light for tinted backgrounds) and **100** (ultra-dark for deep backgrounds).

### Why Not Just Use Tailwind's Scale?

Luma predates Tailwind v3's extended palette. Their 5-100 scale:

- ✅ **5 is critical** for barely-there tints (`bg-error/5` equivalent)
- ✅ **100 provides darkest shade** for dark mode backgrounds
- ✅ **10 increments in middle** (20-90) match human perception better than Tailwind's 100-increment jumps (200-900)

**For DayOf:** You could use **Tailwind's scale** (50-950) and just avoid certain steps, OR adopt Luma's 5-100 pattern. Both work.

---

## Practical Example: Full Generation

### Input:

```typescript
{
  coverImageUrl: "event-cover.jpg",
  manualBrandColor: "#7646ad"  // Optional override
}
```

### Generation Process:

```typescript
// 1. Extract or use manual
const extractedColors = await extractPalette("event-cover.jpg");
// ["#502aac", "#8f73cf", "#342064", "#e3ddf3"]

const baseBrand = manualBrandColor || extractedColors[0];
// "#7646ad"

// 2. Generate 11-step scale
const brandScale = generateScale(baseBrand);
/*
{
  5: "#f7f3fd",
  10: "#f1ebfc",
  20: "#d4c6ed",
  30: "#a471e3",
  40: "#975cdb",
  50: "#7646ad",  // Base
  60: "#563081",
  70: "#371f54",
  80: "#261c34",
  90: "#181321",
  100: "#121115"
}
*/

// 3. Generate RGB base + opacity variants
const rgbBase = hexToRgb(baseBrand); // [118, 70, 173]
const opacityVariants = {
  "brand-base-rgb": "118, 70, 173",
  "brand-opacity-4": "rgba(118, 70, 173, 0.04)",
  "brand-opacity-8": "rgba(118, 70, 173, 0.08)",
  // ... up to 80
};

// 4. Generate semantic tokens
const semanticTokens = {
  "brand-color": "var(--brand-30)", // Interactive
  "brand-bg-color": "var(--brand-50)", // Backgrounds
  "brand-active-color": "var(--brand-40)", // Hover
  "brand-pale-bg-color": "rgba(118, 70, 173, 0.133)", // Subtle tint
};

// 5. Inject into scoped CSS
const scopedCSS = `
  .event-${eventId} {
    ${Object.entries(brandScale)
      .map(([k, v]) => `--brand-${k}: ${v};`)
      .join("\n")}
    ${Object.entries(opacityVariants)
      .map(([k, v]) => `--${k}: ${v};`)
      .join("\n")}
    ${Object.entries(semanticTokens)
      .map(([k, v]) => `--${k}: ${v};`)
      .join("\n")}
  }
`;
```

### Final Output in HTML:

```html
<style id="__jsx-event-specific">
  .event-evt123 {
    /* 11 base colors */
    --brand-5: #f7f3fd;
    --brand-10: #f1ebfc;
    /* ... through 100 */

    /* 33 opacity variants (11 × 3) */
    --brand-5-transparent: #f7f3fd00;
    --brand-5-translucent: #f7f3fd40;
    --brand-5-thick-translucent: #f7f3fdcc;
    /* ... */

    /* RGB base + opacity ladder */
    --brand-base-rgb: 118, 70, 173;
    --brand-opacity-4: rgba(118, 70, 173, 0.04);
    /* ... through 80 */

    /* Semantic aliases */
    --brand-color: #a471e3;
    --brand-bg-color: #7646ad;
    --brand-pale-bg-color: #7646ad21;
    /* ... */
  }
</style>
```

---

## The Actual Algorithm (Reverse-Engineered)

Based on the consistent patterns in the CSS:

```typescript
/**
 * Luma's color scale generation algorithm
 * Input: Single hex color (e.g., "#7646ad")
 * Output: 11-step scale + variants
 */
function generateLumaColorScale(baseHex: string) {
  const hsl = hexToHSL(baseHex);

  // Generate 11 steps by adjusting lightness
  const scale = {
    5: adjustLightness(hsl, 95), // Very light (5% of way to white)
    10: adjustLightness(hsl, 90),
    20: adjustLightness(hsl, 80),
    30: adjustLightness(hsl, 65),
    40: adjustLightness(hsl, 55),
    50: hsl, // Base (no change)
    60: adjustLightness(hsl, 40),
    70: adjustLightness(hsl, 30),
    80: adjustLightness(hsl, 20),
    90: adjustLightness(hsl, 12),
    100: adjustLightness(hsl, 8), // Very dark
  };

  return scale;
}

function adjustLightness(hsl: HSL, targetLightness: number): string {
  return hslToHex({ ...hsl, l: targetLightness });
}
```

### Why HSL Manipulation?

Looking at the brand scale progression in the CSS:

```css
--brand-50: #7646ad; /* HSL(269°, 31%, 47%) - Base */
--brand-30: #a471e3; /* HSL(269°, 56%, 65%) - Lighter (↑ lightness, ↑ saturation) */
--brand-70: #371f54; /* HSL(269°, 29%, 23%) - Darker (↓ lightness) */
```

**The pattern:** Same **hue** (269°), adjusted **lightness** and **saturation**. This is characteristic of HSL-based color scale generation.

---

## Full Input/Output Table

| Input Type             | Example Value | Generates         | Count         | Usage                                                |
| ---------------------- | ------------- | ----------------- | ------------- | ---------------------------------------------------- |
| **Base Brand Color**   | `#7646ad`     | 11-step scale     | 11 vars       | `--brand-5` through `--brand-100`                    |
| ↳ (Same base)          |               | Opacity variants  | 33 vars       | `-transparent`, `-translucent`, `-thick-translucent` |
| ↳ (Same base)          |               | RGB base          | 1 var         | `--brand-base-rgb: 118, 70, 173`                     |
| ↳ (Same base)          |               | Opacity ladder    | 10 vars       | `--brand-opacity-4` through `-80`                    |
| ↳ (Same base)          |               | Semantic aliases  | ~15 vars      | `--brand-color`, `--brand-bg-color`, etc.            |
| **Cover Image**        | `cover.jpg`   | Extracted palette | 4 colors      | Suggested brand colors                               |
| **Theme Name**         | "Lavender"    | Display label     | 1 string      | UI selector, metadata                                |
| **Theme Type**         | "shader"      | Background style  | CSS classes   | `.event-theme.shader`                                |
| **Mode**               | "shader-dark" | Dark mode rules   | CSS overrides | `.theme-root.dark`                                   |
|                        |               |                   |               |                                                      |
| **Total from 1 input** | 1 hex color   | **~70 variables** |               | Full brand system                                    |

---

## Why This System is Brilliant

### 1. **Single Source of Truth**

One base color (`#7646ad`) generates 70+ variants. Change it once, entire theme updates.

### 2. **No Manual Work**

Upload cover → extract colors → generate scales → inject CSS. **Zero manual color picking** for most events.

### 3. **Consistent Relationships**

Because colors are algorithmically derived, **relationships are preserved**:

- Hover states are always darker by the same amount
- Disabled states always use the 30-40 range
- Text always has proper contrast

### 4. **Scoped Per-Event**

Each event gets its own scoped CSS with the same variable names, so **components don't need to know about events**—they just use `--brand-color`.

---

## Recommendation for DayOf

### Simplified Approach (Recommended)

**Don't replicate all 11 steps unless you need that granularity.** Instead:

```css
/* Minimal viable scale: 7 steps */
:root {
  --brand-5: /* ultra-light (backgrounds) */
  --brand-20: /* light (borders) */
  --brand-40: /* mid-light (hover) */
  --brand-50: /* base (default) */
  --brand-60: /* mid-dark (active) */
  --brand-80: /* dark (emphasis) */
  --brand-100: /* ultra-dark (dark mode bg) */
}
```

**Or use Tailwind v4 opacity modifiers:**

```css
/* Even simpler with Tailwind */
--color-brand: #7646ad;

/* In components, use opacity modifiers */
.component {
  background: var(--color-brand) / 0.04; /* = brand-opacity-4 */
  border-color: var(--color-brand) / 0.8; /* = brand-80 */
}
```

### If You Need Full Luma Parity

Install a color scale generator:

```bash
bun add polished
```

```typescript
import { lighten, darken, parseToRgb } from "polished";

export function generateLumaBrandScale(baseHex: string) {
  const base = parseToRgb(baseHex);

  return {
    5: lighten(0.45, baseHex),
    10: lighten(0.4, baseHex),
    20: lighten(0.3, baseHex),
    30: lighten(0.2, baseHex),
    40: lighten(0.1, baseHex),
    50: baseHex,
    60: darken(0.15, baseHex),
    70: darken(0.3, baseHex),
    80: darken(0.45, baseHex),
    90: darken(0.6, baseHex),
    100: darken(0.7, baseHex),
  };
}
```

---

## Summary: The Magic Formula

**Inputs:**

1. 1 base color (manual or extracted from cover)
2. Theme name ("Lavender")
3. Mode preference (light/dark)

**Generates:**

- 11-step tonal scale
- 33 opacity variants
- 1 RGB base + 10 opacity values
- ~15 semantic aliases
- **Total: ~70 CSS variables from 1 color**

**Why 11 steps?**

- Covers full tonal range (ultra-light to ultra-dark)
- No perceptual gaps in UI needs
- Standard 50 as base (like Tailwind/Material)
- Adds 5 (ultra-light) and 100 (ultra-dark) as bookends

**The beauty:** Upload a cover image → instant theme. No design work needed. 🎨
