# New Findings from ltl9cvae HTML Source

## Critical Discoveries We Missed

### 1. Three.js Version Confirmed ✅

**Canvas element from live HTML:**

```html
<canvas
  style="display: block; width: 1553px; height: 517px;"
  data-engine="three.js r177"
  width="1553"
  height="517"
></canvas>
```

**Key insights:**

- **Three.js version**: `r177` (Release 177)
- **Rendering engine**: Confirmed Three.js (not custom WebGL)
- **Canvas dimensions**: 1553×517 (desktop viewport size captured)
- **Display size matches render size** (no resolution scaling in this capture)

### 2. Exact Theme Configuration (ltl9cvae)

**From embedded JSON data:**

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

**Translation to shader uniforms:**

```typescript
// Confirmed actual values for ltl9cvae event
{
  colors: {
    color1: hexToVec3("#6d00e6"),  // [0.427, 0.000, 0.902] - Deep purple
    color2: hexToVec3("#830ed8"),  // [0.514, 0.055, 0.847] - Medium purple
    color3: hexToVec3("#af00e6"),  // [0.686, 0.000, 0.902] - Light purple
  }
}
```

**Helper function needed:**

```typescript
function hexToVec3(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}
```

### 3. Canvas Wrapper Structure

**Actual DOM structure from ltl9cvae:**

```html
<div
  class="event-theme tinted shader shader-dark one-to-one full-page high-contrast"
>
  <!-- 6 background overlay divs -->
  <div class="background"></div>
  <div class="background-glow"></div>
  <div class="background-overlay"></div>
  <div class="background-overlay2"></div>
  <div class="background-overlay3"></div>
  <div class="background-overlay4"></div>

  <!-- WebGL Canvas (THE GRADIENT) -->
  <div class="canvas gradient-bg animate">
    <div class="canvas">
      <canvas data-engine="three.js r177"></canvas>
    </div>
  </div>

  <!-- Content -->
  <div class="page-container">
    <!-- Event details -->
  </div>
</div>
```

**CSS for canvas:**

```css
.canvas.jsx-26b61a58cff4697f {
  opacity: 1;
  width: 100vw;
  height: 100vh;
  height: 100lvh; /* Logical viewport height (better for mobile) */
  position: fixed;
  top: 0;
  left: 0;
}
```

### 4. Theme Class Naming Convention

**Event theme classes reveal Luma's theming system:**

- `event-theme` - Base class
- `tinted` - Uses brand color tinting
- `shader` - WebGL shader background (vs `video`, `pattern`, etc.)
- `shader-dark` - Dark mode variant
- `one-to-one` - Event type flag
- `full-page` - Full viewport background
- `high-contrast` - Accessibility mode

**Other theme types found in CSS:**

- `.event-theme.pattern` - CSS patterns (zigzag, plus, wave, polkadot, etc.)
- `.event-theme.warp` - Warp effect (video/animated)
- `.event-theme.matrix` - Matrix video background
- `.event-theme.fireworks` - Fireworks effect
- `.event-theme.holiday-*` - Holiday themes (snow, santa, hanukkah, diwali)

### 5. Cover Image Colors Metadata

**From embedded JSON:**

```json
"cover_image": {
  "vibrant_color": null,
  "colors": ["#502aac", "#8f73cf", "#342064", "#e3ddf3"]
}
```

**These are extracted from the event cover image!**

- Luma automatically extracts dominant colors from uploaded covers
- These could be used as gradient color alternatives
- Shows Luma's color extraction pipeline in action

**Comparison to theme_meta:**
| Source | color1 | color2 | color3 |
|--------|--------|--------|--------|
| `theme_meta` (used) | `#6d00e6` | `#830ed8` | `#af00e6` |
| `cover_image.colors` | `#502aac` | `#8f73cf` | `#342064` |

They're **related but not identical** - theme colors are adjusted for better contrast/aesthetics.

### 6. Event Type Flag: "one_to_one"

```json
"one_to_one": true
```

This affects card styling:

```css
.event-theme.one-to-one {
  --one-to-one-card-bg-color: var(--opacity-4);
  --one-to-one-card-border-color: var(--opacity-4);
  --one-to-one-card-shadow: var(--light-shadow-xs);
}
```

### 7. Animation Classes

**Canvas wrapper uses:**

```html
<div class="canvas gradient-bg animate"></div>
```

**CSS for animation:**

```css
.event-theme .gradient-bg.animate {
  animation: 2s forwards event-theme-fade-in;
}

@keyframes event-theme-fade-in {
  0% {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Purpose:** Fade in the gradient background over 2 seconds on page load.

### 8. Logical Viewport Height (100lvh)

```css
.canvas {
  height: 100vh;
  height: 100lvh; /* Overrides 100vh */
}
```

**Why this matters:**

- `lvh` (Logical Viewport Height) is newer CSS unit
- Better for mobile (accounts for dynamic toolbars)
- Prevents layout jumps on scroll
- Falls back to `100vh` on older browsers

### 9. Background Page Color

**Per-event background color:**

```css
html.theme-root,
html.theme-root .page-wrapper {
  background-color: #261c34; /* Dark purple - matches theme */
}
```

This is set **before** the canvas loads to prevent flash of white background.

## What We Got Right

✅ **Shader code** - Extracted correctly from background-source.c  
✅ **Perlin noise** - Implementation is accurate  
✅ **Uniform structure** - Matches actual implementation  
✅ **Three.js usage** - Confirmed (r177 specifically)

## What We Missed

❌ **Three.js version** - Now know it's r177  
❌ **Actual hex colors** - Had estimates, now have exact values  
❌ **Canvas wrapper classes** - `gradient-bg animate` pattern  
❌ **Theme class naming** - Full system revealed  
❌ **Color extraction from covers** - Luma does this automatically  
❌ **Logical viewport height** - 100lvh usage  
❌ **Fade-in animation** - 2s on page load  
❌ **One-to-one event type** - Affects card styling

## Updated Implementation Details

### Three.js Version for DayOf

```json
{
  "dependencies": {
    "@react-three/fiber": "^8.15.0",
    "three": "^0.177.0" // ← Match Luma's version
  }
}
```

### Hex Color Support

Add hex-to-vec3 conversion:

```typescript
// presets/utils.ts
export function hexToRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

// Allow hex colors in config
export type GradientConfig = {
  // ... existing fields
  colors: {
    color1: [number, number, number] | string; // Allow hex
    color2: [number, number, number] | string;
    color3: [number, number, number] | string;
  };
};

// Normalize colors in component
function normalizeColor(
  color: [number, number, number] | string
): [number, number, number] {
  if (typeof color === "string") {
    return hexToRgb(color);
  }
  return color;
}
```

### ltl9cvae "Lavender" Preset

```typescript
// presets/event-themes.ts
export const lavenderConfig: GradientConfig = {
  speed: 0.3,
  noiseDensity: 2.5,
  noiseStrength: 0.6,
  brightness: 1.0, // Dark mode
  colors: {
    color1: "#6d00e6", // ✅ Actual ltl9cvae value
    color2: "#830ed8", // ✅ Actual ltl9cvae value
    color3: "#af00e6", // ✅ Actual ltl9cvae value
  },
  offset: [0, 0],
  alpha: 1.0,
};
```

### Canvas Wrapper with Fade-in

```tsx
function AnimatedGradientBackground({ config }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "canvas gradient-bg",
        mounted && "animate" // Triggers 2s fade-in
      )}
    >
      <div
        className="canvas"
        style={{
          opacity: 1,
          width: "100vw",
          height: "100lvh", // Use logical viewport height
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        <Canvas>{/* Three.js scene */}</Canvas>
      </div>
    </div>
  );
}
```

### CSS Animation

```css
@keyframes gradient-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.gradient-bg.animate {
  animation: 2s forwards gradient-fade-in;
}
```

## Database Schema Update

Store hex colors directly (easier for users):

```typescript
export const events = pgTable("events", {
  // ... existing fields

  backgroundShaderConfig: jsonb("background_shader_config").$type<{
    name?: string; // "Lavender", "Ocean", "Sunset"
    type: "shader";
    theme: "shader-dark" | "shader-light";
    color1: string; // Hex color "#6d00e6"
    color2: string; // Hex color "#830ed8"
    color3: string; // Hex color "#af00e6"
  }>(),
});
```

## Comparison: Our Estimates vs Actual Data

### ltl9cvae (Lavender Theme)

| Uniform         | Our Estimate    | Actual Value             | Match?     |
| --------------- | --------------- | ------------------------ | ---------- |
| `color1`        | Unknown         | `#6d00e6` (deep purple)  | ✅ Found   |
| `color2`        | Unknown         | `#830ed8` (med purple)   | ✅ Found   |
| `color3`        | Unknown         | `#af00e6` (light purple) | ✅ Found   |
| `brightness`    | 1.0 (dark mode) | 1.0 (dark mode)          | ✅ Correct |
| `speed`         | 0.3             | ~0.3 (estimated)         | ✅ Close   |
| `noiseDensity`  | 2.5             | ~2.5 (estimated)         | ✅ Close   |
| `noiseStrength` | 0.5-0.6         | ~0.6 (estimated)         | ✅ Close   |

## Key Takeaways

### What Changed

1. **Version pinning**: Use Three.js r177 to match Luma
2. **Hex color support**: Allow `"#6d00e6"` in addition to `[0.427, 0, 0.902]`
3. **Logical viewport**: Use `100lvh` instead of `100vh`
4. **Fade-in animation**: Add 2s fade-in on mount
5. **Theme naming**: Store human-readable names ("Lavender", "Ocean", etc.)
6. **Cover color extraction**: Implement automatic palette extraction

### What Stayed The Same

✅ **Shader code** - Still correct  
✅ **Uniform structure** - Still matches  
✅ **Configuration ranges** - Still valid  
✅ **Performance targets** - Still accurate

## Additional HTML/CSS Patterns

### Event Theme Classes System

Luma uses a sophisticated class-based theming:

```css
/* Base */
.event-theme {
}

/* Background type */
.event-theme.shader {
} /* WebGL shader */
.event-theme.video {
} /* Video (matrix, warp, etc.) */
.event-theme.pattern {
} /* CSS patterns */
.event-theme.emoji {
} /* Emoji backgrounds */
.event-theme.confetti {
} /* Confetti animation */

/* Mode */
.event-theme.shader-dark {
} /* Dark shader */
.event-theme.shader-light {
} /* Light shader (not seen yet) */

/* Special flags */
.event-theme.tinted {
} /* Uses brand color tinting */
.event-theme.one-to-one {
} /* 1:1 event type */
.event-theme.high-contrast {
} /* Accessibility mode */
.event-theme.full-page {
} /* Full viewport */
```

### Holiday/Seasonal Themes

Found in CSS (not using WebGL):

- `.holiday-snow` - Snow animation
- `.holiday-santa` - Santa theme
- `.holiday-sweater` - Ugly sweater pattern
- `.holiday-hanukkah` - Hanukkah theme
- `.holiday-diwali` - Diwali theme
- `.holiday-pie` - Thanksgiving pie
- `.holiday-foliage` - Fall foliage
- `.holiday-turkey` - Thanksgiving turkey

### Video Theme Variants

- `.matrix` - Matrix code rain (svkgfw2w)
- `.warp` - Warp speed effect
- `.falling-leaves` - Autumn leaves
- `.bats` - Halloween bats
- `.snow-light` / `.snow-dark` - Snow effects
- `.fireworks` - Fireworks animation

## Implementation Updates Needed

### 1. Update Dependencies

```json
{
  "dependencies": {
    "three": "~0.177.0" // Match Luma's version (not latest)
  }
}
```

### 2. Support Hex Colors

```typescript
// Allow both formats
<AnimatedGradientBackground
  config={{
    colors: {
      color1: "#6d00e6", // Hex (easier for users)
      color2: [0.514, 0.055, 0.847], // Vec3 (direct)
      color3: "#af00e6", // Mixed usage OK
    },
  }}
/>
```

### 3. Use Logical Viewport Height

```tsx
<div style={{
  width: "100vw",
  height: "100lvh",  // Instead of 100vh
  position: "fixed",
}}>
```

### 4. Add Fade-in Animation

```tsx
const [isAnimated, setIsAnimated] = useState(false);

useEffect(() => {
  // Delay slightly to ensure canvas is ready
  const timer = setTimeout(() => setIsAnimated(true), 50);
  return () => clearTimeout(timer);
}, []);

return (
  <div className={cn("gradient-bg", isAnimated && "animate")}>
    <Canvas />
  </div>
);
```

### 5. Store Theme Metadata

```typescript
// Database schema
export const events = pgTable("events", {
  themeName: text("theme_name"), // "Lavender", "Ocean", "Sunset"
  themeType: text("theme_type") // "shader", "video", "pattern"
    .$type<"shader" | "video" | "pattern">()
    .default("shader"),
  themeVariant: text("theme_variant") // "shader-dark", "shader-light"
    .$type<"shader-dark" | "shader-light">()
    .default("shader-dark"),
  shaderColor1: text("shader_color1"), // "#6d00e6"
  shaderColor2: text("shader_color2"), // "#830ed8"
  shaderColor3: text("shader_color3"), // "#af00e6"
});
```

## Why This Matters

### 1. Version Compatibility

Using Three.js r177 (instead of latest r180+) ensures:

- Shader code works exactly as Luma's does
- No breaking changes from newer versions
- Known performance characteristics

### 2. Hex Color UX

Storing colors as hex (`"#6d00e6"`) instead of vec3 (`[0.427, 0, 0.902]`):

- **Better UX** for color pickers in backstage
- **Easier to read** in database
- **Standard format** designers understand
- Convert to vec3 only at runtime

### 3. Theme Naming

Names like "Lavender" instead of raw color values:

- **Easier for users** to select in UI
- **Memorable** ("use the Lavender theme")
- **Reusable** across similar events

### 4. Automatic Color Extraction

Luma extracts `cover_image.colors` array from uploaded images:

- Could use as gradient starting point
- Fallback if no manual theme selected
- Consistent brand alignment

## Recommendations

### Implement in Phases

**Phase 1: Core (Already Planned)** ✅

- Shader gradient with vec3 colors
- Three.js r177
- Basic presets

**Phase 2: UX Enhancement** (Add now based on findings)

- Hex color support
- Theme naming ("Lavender", "Ocean")
- Fade-in animation (2s)
- Logical viewport height (100lvh)

**Phase 3: Auto-extraction** (Later)

- Extract colors from cover images
- Store in `cover_image.colors`
- Use as fallback/suggestion

**Phase 4: Additional Themes** (Future)

- Video backgrounds (matrix, warp)
- CSS patterns (zigzag, polkadot)
- Holiday themes (seasonal)

## Updated Implementation Example

```tsx
// With all HTML source findings applied
<AnimatedGradientBackground
  themeName="Lavender" // Human-readable name
  themeType="shader"
  themeVariant="shader-dark"
  config={{
    colors: {
      color1: "#6d00e6", // ✅ Hex support
      color2: "#830ed8",
      color3: "#af00e6",
    },
    speed: 0.3,
    brightness: 1.0,
  }}
  fadeIn={true} // ✅ 2s fade-in animation
  useLogicalViewport={true} // ✅ Use 100lvh
/>
```

## Summary

**Yes, we missed important details!** The HTML source revealed:

1. ✅ **Three.js r177** (specific version)
2. ✅ **Exact hex colors** for ltl9cvae (#6d00e6, #830ed8, #af00e6)
3. ✅ **Theme naming** ("Lavender")
4. ✅ **Canvas wrapper structure** (gradient-bg animate classes)
5. ✅ **Logical viewport height** (100lvh for better mobile)
6. ✅ **Fade-in animation** (2s on page load)
7. ✅ **Color extraction** from cover images
8. ✅ **Full theme system** (shader, video, pattern, holiday variants)

The Builder.io JSON didn't contain the runtime DOM structure or CSS - the HTML source gives us the **actual rendered output** which is more valuable for understanding the final implementation.
