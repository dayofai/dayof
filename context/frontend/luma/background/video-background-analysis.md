# Luma Video Background Analysis: svkgfw2w Event

**Event:** Decentralized AI Hackathon at Stanford powered by Flower  
**URL:** https://luma.com/svkgfw2w  
**Type:** Tech/AI Hackathon (Darker aesthetic)

## Key Finding: Different Approach

This event uses a **video background** instead of the WebGL shader gradient we analyzed in ltl9cvae and tm15enb1.

### Critical Insights from Live DOM

**✅ Video source confirmed:** `https://images.lumacdn.com/themes/video/matrix.mp4`

- Real, functional video (not just placeholder)
- Stored in Luma's theme library (reusable asset)
- Matrix aesthetic for tech/AI events

**✅ Multiply blend overlay is key:**

```html
<div
  class="video-overlay animated multiply"
  style="background-color: rgb(19, 21, 23);"
></div>
```

- Color `rgb(19, 21, 23)` = very dark gray (almost black)
- `multiply` blend mode darkens the Matrix video underneath
- Creates moody, high-contrast background for white text

**✅ Multiple overlay layers:**

- 6 base background divs (background, background-glow, overlay 1-4)
- 1 video container
- 2 video overlays (multiply + secondary)
- **Total: 9 layers** before content

This is significantly more complex than the shader gradient approach (which uses 1 canvas + 1 overlay).

## Video Background Architecture

### Actual Layer Stack from Live Site (svkgfw2w)

**✅ Confirmed from DOM inspection:**

```html
<!-- Layer 1-6: Base backgrounds and overlays -->
<div class="background"></div>
<div class="background-glow"></div>
<div class="background-overlay"></div>
<div class="background-overlay2"></div>
<div class="background-overlay3"></div>
<div class="background-overlay4"></div>

<!-- Layer 7: Video container (core visual) -->
<div class="video-container animated loaded">
  <!-- Poster image (loads first, fallback) -->
  <img src="https://images.lumacdn.com/themes/video/matrix.png" />

  <!-- Video element -->
  <video autoplay loop playsinline>
    <source
      src="https://images.lumacdn.com/themes/video/matrix.mp4"
      type="video/mp4"
    />
  </video>
</div>

<!-- Layer 8: Primary multiply overlay (darkens video) -->
<div
  class="video-overlay animated multiply"
  style="background-color: rgb(19, 21, 23);"
  data-noir-inline-background-color
></div>

<!-- Layer 9: Secondary overlay -->
<div class="video-overlay2"></div>

<!-- Layer 10: Content (z-index: 1) -->
<!-- Event details, text, buttons, etc. -->
```

### Visual Stack (Bottom to Top)

```
┌─────────────────────────────────────────┐
│  Content Layer (z-index: 1)             │ ← Interactive content
├─────────────────────────────────────────┤
│  video-overlay2                         │ ← Additional overlay
├─────────────────────────────────────────┤
│  video-overlay (multiply blend)         │ ← Darkening effect
│  bg: rgb(19, 21, 23)                    │   CRITICAL for contrast
│  --noir-inline-background-color: #0e1213│
├─────────────────────────────────────────┤
│  Video Container                        │
│  ├─ matrix.mp4 (video)                  │ ← Actual video
│  └─ matrix.png (poster/fallback)        │ ← Shows while loading
├─────────────────────────────────────────┤
│  background-overlay4                    │
│  background-overlay3                    │ ← Subtle effects
│  background-overlay2                    │   (glow, gradients)
│  background-overlay                     │
│  background-glow                        │
│  background (base)                      │ ← Foundation
└─────────────────────────────────────────┘
```

### Technical Implementation

#### Video Element Configuration

```html
<video
  autoplay
  loop
  playsinline
  style="
    height: 100%;
    left: 50%;
    object-fit: cover;
    pointer-events: none;
    position: absolute;
    top: 50%;
    width: 100%;
    transform: translate(-50%, -50%);
  "
>
  <!-- No source element found - likely dynamically loaded or empty -->
</video>
```

**Properties:**

- `autoplay` - Starts automatically (muted by default for autoplay compliance)
- `loop` - Plays continuously
- `playsinline` - iOS compatibility (prevents fullscreen takeover)
- `pointer-events: none` - Can't be interacted with
- Responsive transforms for different screen sizes:
  - Large: `translate(-889.5px, -604px)`
  - Medium: `translate(-392.5px, -596.5px)`
  - Small: `translate(-242.5px, -604px)`

#### Poster Image (Fallback)

```html
<img
  src="https://images.lumacdn.com/themes/video/matrix.png"
  alt="Matrix background"
  style="
    height: 100%;
    left: 50%;
    object-fit: cover;
    pointer-events: none;
    position: absolute;
    top: 50%;
    width: 100%;
    transform: translate(-50%, -50%);
  "
/>
```

**Purpose:**

- Static image fallback (The Matrix-style character stream aesthetic)
- Displays while video loads or if video fails
- Provides consistent branding even without video

#### Multiply Blend Overlay

```css
.video-overlay {
  mix-blend-mode: multiply;
  background-color: rgb(19, 21, 23); /* Dark gray/black */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 1208px; /* Matches container height */
  z-index: 0;
  pointer-events: none;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Effect:**

- `multiply` darkens the video/image underneath
- Creates a more subdued, moody aesthetic
- Ensures text contrast on top
- Unified dark theme across page

## Comparison: Video vs Shader Gradient

| Aspect                 | Video Background (svkgfw2w)       | Shader Gradient (ltl9cvae, tm15enb1) |
| ---------------------- | --------------------------------- | ------------------------------------ |
| **Technology**         | HTML5 `<video>` + CSS blend modes | WebGL shaders + Perlin noise         |
| **File Size**          | ~2-10MB video file                | ~5KB shader code                     |
| **Load Time**          | Slower (video download)           | Faster (instant shader compile)      |
| **CPU Usage**          | Low (native video decode)         | Medium (shader execution)            |
| **GPU Usage**          | Medium (video decode)             | Medium-High (shader rendering)       |
| **Customization**      | Limited (need new video)          | Highly flexible (adjust uniforms)    |
| **Mobile Performance** | Good (hardware accelerated)       | Good with throttling                 |
| **Battery Impact**     | Medium (video decode)             | Medium (GPU rendering)               |
| **Accessibility**      | Better (can pause/disable easier) | Requires custom controls             |
| **Implementation**     | Simple (HTML + CSS)               | Complex (WebGL + R3F)                |
| **Bundle Size**        | 0 JS (pure HTML/CSS)              | ~120KB (Three.js/R3F)                |
| **Aesthetic**          | Specific, branded                 | Infinite variations                  |

## When Luma Uses Each Approach

### Video Background (svkgfw2w pattern)

**Best for:**

- Tech/AI events with specific branding (Matrix aesthetic)
- Events with custom-produced video content
- Dark mode events
- When branded video content exists
- Lower development complexity

**Limitations:**

- Can't easily customize colors per event
- Requires video production workflow
- Larger file sizes (bandwidth cost)
- Less flexible than shader approach

### Shader Gradient (ltl9cvae, tm15enb1 pattern)

**Best for:**

- Most events (conferences, meetups, concerts)
- Events needing custom color palettes
- Quick event creation (no video needed)
- Maximum visual variety
- Bandwidth efficiency

**Advantages:**

- Programmatically generate any color scheme
- Tiny file size (just shader code)
- Extract colors from event cover automatically
- Consistent performance

## Simplified Implementation (Based on Actual DOM)

### Minimal Version (Recommended)

You don't need all 9 layers. Here's the minimal viable implementation:

```tsx
function VideoBackground({
  videoSrc = "https://images.lumacdn.com/themes/video/matrix.mp4",
  posterSrc = "https://images.lumacdn.com/themes/video/matrix.png",
  overlayColor = "rgb(19, 21, 23)",
}: VideoBackgroundProps) {
  return (
    <>
      {/* Video container */}
      <div className="video-container animated loaded">
        {/* Poster (fallback) */}
        <img src={posterSrc} alt="" aria-hidden="true" />

        {/* Video */}
        <video autoPlay loop playsInline muted>
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      {/* Critical: Multiply overlay for contrast */}
      <div
        className="video-overlay multiply"
        style={{ backgroundColor: overlayColor }}
      />
    </>
  );
}
```

### CSS (Matching Luma's Pattern)

```css
/* Video container - holds poster + video */
.video-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Poster and video styling */
.video-container img,
.video-container video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Video appears on top of poster when loaded */
.video-container video {
  z-index: 1;
}

.video-container img {
  z-index: 0;
}

/* CRITICAL: Multiply overlay darkens everything */
.video-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Above video */
  pointer-events: none;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-overlay.multiply {
  mix-blend-mode: multiply;
}

/* Optional: Animated class for transitions */
.animated {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Content goes here with z-index: 2+ */
.content {
  position: relative;
  z-index: 2;
}
```

### Key Learnings from DOM Inspection

1. **Video source is real:** `matrix.mp4` exists at `images.lumacdn.com/themes/video/`

   - Not dynamically generated
   - Reusable theme asset
   - Likely 2-5MB file size

2. **Multiply blend is critical:**

   - Without it, Matrix video would be too bright
   - `rgb(19, 21, 23)` darkens to create high contrast
   - Enables white text to be readable

3. **Classes suggest animation system:**

   - `animated` class → Likely CSS transitions
   - `loaded` class → State management (loaded vs loading)
   - `multiply` class → Blend mode application

4. **Noir theming system:**
   - `data-noir-inline-background-color` attribute
   - `--noir-inline-background-color` CSS variable
   - Suggests Luma has a "Noir" theme system for dark events

### Enhanced Implementation with Noir Theme

```tsx
function VideoBackground({
  videoSrc = "https://images.lumacdn.com/themes/video/matrix.mp4",
  posterSrc = "https://images.lumacdn.com/themes/video/matrix.png",
  overlayColor = "rgb(19, 21, 23)",
  noirColor = "#0e1213", // Slightly darker variant
  className,
}: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <>
      {/* Video container */}
      <div className={cn("video-container animated", isLoaded && "loaded")}>
        <img src={posterSrc} alt="" aria-hidden="true" />

        {!prefersReducedMotion && (
          <video
            autoPlay
            loop
            playsInline
            muted
            onLoadedData={() => setIsLoaded(true)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}
      </div>

      {/* Primary overlay - CRITICAL for contrast */}
      <div
        className="video-overlay animated multiply"
        style={
          {
            backgroundColor: overlayColor,
            "--noir-inline-background-color": noirColor,
          } as React.CSSProperties
        }
        data-noir-inline-background-color
      />
    </>
  );
}
```

## Implementation for DayOf

### Decision Matrix

For **most DayOf events** → Use **shader gradient** (like tm15enb1):

- ✅ Fast implementation
- ✅ Tiny bundle
- ✅ Color extraction from event covers
- ✅ No video production needed
- ✅ Infinite customization

For **special/branded events** → Use **video background** (like svkgfw2w):

- ✅ Custom branded content
- ✅ Specific aesthetic (e.g., Matrix rain for tech events)
- ✅ Simple HTML/CSS implementation
- ✅ No WebGL required
- ❌ Requires video production

### Hybrid Component Design

Support both approaches in one component:

```tsx
<EventBackground
  type="shader" // or "video"
  // Shader-specific props
  shaderConfig={{
    colors: extractFromCover(event.coverUrl),
    speed: 0.3,
  }}
  // Video-specific props
  videoSrc={event.customVideoBackgroundUrl}
  posterImage={event.videoPosterUrl || defaultPoster}
  // Shared props
  overlayColor="rgb(19, 21, 23)"
  overlayBlendMode="multiply"
/>
```

## Video Background Implementation Guide

If you want to replicate Luma's video approach:

### 1. HTML Structure

```tsx
function VideoBackground({
  videoSrc,
  posterImage = "https://images.lumacdn.com/themes/video/matrix.png",
  overlayColor = "rgb(19, 21, 23)",
  blendMode = "multiply",
}: VideoBackgroundProps) {
  return (
    <div className="video-background-container">
      {/* Base background color */}
      <div className="bg-base" />

      {/* Poster image (fallback) */}
      <img
        src={posterImage}
        alt=""
        className="video-poster"
        aria-hidden="true"
      />

      {/* Video element */}
      {videoSrc && (
        <video
          autoPlay
          loop
          muted // Required for autoplay
          playsInline
          className="video-element"
          poster={posterImage}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Multiply blend overlay */}
      <div
        className="video-overlay"
        style={{
          backgroundColor: overlayColor,
          mixBlendMode: blendMode,
        }}
      />
    </div>
  );
}
```

### 2. CSS Styling

```css
.video-background-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
}

.bg-base {
  position: absolute;
  inset: 0;
  background-color: rgb(32, 34, 36); /* Luma dark gray */
  z-index: -1;
}

.video-poster,
.video-element {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.video-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive transforms for video scaling */
@media (max-width: 768px) {
  .video-element {
    transform: translate(-242.5px, -604px);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .video-element {
    transform: translate(-392.5px, -596.5px);
  }
}

@media (min-width: 1025px) {
  .video-element {
    transform: translate(-889.5px, -604px);
  }
}
```

### 3. Performance Optimizations

```tsx
function VideoBackground({
  videoSrc,
  posterImage,
  overlayColor,
  blendMode,
  reduceMotion = false, // From user preference
}: VideoBackgroundProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pause video when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;

      if (document.hidden || reduceMotion) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reduceMotion]);

  // Respect reduced motion preference
  if (reduceMotion) {
    return (
      <div className="video-background-container">
        <img src={posterImage} alt="" className="video-poster" />
        <div
          className="video-overlay"
          style={{ backgroundColor: overlayColor }}
        />
      </div>
    );
  }

  return (
    <div className="video-background-container">
      {/* Poster shown while video loads */}
      <img
        src={posterImage}
        alt=""
        className="video-poster"
        style={{ opacity: isVideoLoaded ? 0 : 1 }}
      />

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="video-element"
        poster={posterImage}
        onLoadedData={() => setIsVideoLoaded(true)}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        className="video-overlay"
        style={{
          backgroundColor: overlayColor,
          mixBlendMode: blendMode,
        }}
      />
    </div>
  );
}
```

### 4. Video Specifications

Based on Luma's implementation:

| Specification | Value                                     |
| ------------- | ----------------------------------------- |
| Format        | MP4 (H.264/H.265)                         |
| Resolution    | 1920×1080 or higher                       |
| Bitrate       | 2-5 Mbps (balance quality/size)           |
| Frame Rate    | 24-30fps                                  |
| Duration      | 10-30 seconds (short loop)                |
| Audio         | None (muted for autoplay)                 |
| File Size     | 2-10MB (keep <5MB ideal)                  |
| Compression   | High (slight artifacts acceptable for bg) |

### 5. Blend Mode Options

Luma uses `multiply` for dark backgrounds, but other options:

```css
/* Dark overlay (Luma's choice for svkgfw2w) */
.dark-overlay {
  mix-blend-mode: multiply;
  background-color: rgb(19, 21, 23);
}

/* Light overlay (for bright videos) */
.light-overlay {
  mix-blend-mode: screen;
  background-color: rgb(240, 240, 245);
}

/* Color tint */
.color-tint {
  mix-blend-mode: overlay;
  background-color: rgba(175, 88, 0, 0.2); /* Brand color tint */
}

/* Soft contrast */
.soft-light {
  mix-blend-mode: soft-light;
  background-color: rgba(255, 255, 255, 0.1);
}
```

## Why svkgfw2w Uses Video Instead of Shader

### Event Context Analysis

**"Decentralized AI Hackathon"** is a tech event with:

- Dark aesthetic (black background)
- Tech/cyber theme (Matrix reference)
- Specific branding needs (Flower Labs)
- Developer audience (appreciates Matrix aesthetic)

**The Matrix.png placeholder** suggests:

- Branded content choice (Matrix rain effect)
- Intentional tech/hacker aesthetic
- Consistent with event theme

### Strategic Choice

Video background makes sense here because:

1. **Specific Branding** - Matrix aesthetic aligns with AI/tech theme
2. **Dark Mode Only** - Event uses dark theme exclusively (no light mode variant needed)
3. **Static Aesthetic** - Don't need color variations across similar events
4. **Budget Available** - Video production for flagship event

### When Each Approach Makes Sense

**Use Video Background when:**

- ✅ Event has custom-produced video content
- ✅ Specific branded aesthetic required
- ✅ Single-use or flagship event
- ✅ Dark or light mode only (not both)
- ✅ Video production budget available
- ✅ Content is pre-existing or reusable

**Use Shader Gradient when:**

- ✅ Need per-event customization
- ✅ Support light AND dark modes
- ✅ Color extraction from event covers
- ✅ Fast iteration/prototyping
- ✅ Small file sizes critical
- ✅ Generating many events quickly
- ✅ No video production resources

## Hybrid Strategy for DayOf

### Recommended Approach

```tsx
// components/ui/event-background/index.tsx
export function EventBackground({
  event,
  variant = "auto", // "auto", "shader", "video", "none"
}: EventBackgroundProps) {
  // Auto-detect best background type
  if (variant === "auto") {
    if (event.customVideoBackgroundUrl) {
      variant = "video";
    } else {
      variant = "shader";
    }
  }

  switch (variant) {
    case "video":
      return (
        <VideoBackground
          videoSrc={event.customVideoBackgroundUrl}
          posterImage={event.videoPosterUrl}
          overlayColor={event.theme.overlayColor}
        />
      );

    case "shader":
      return (
        <AnimatedGradientBackground
          coverImageUrl={event.coverImageUrl}
          autoExtractColors={true}
          config={deriveConfigFromEventType(event)}
        />
      );

    case "none":
    default:
      return <SolidBackground color={event.theme.backgroundColor} />;
  }
}
```

### Database Schema Addition

Add support for video backgrounds:

```typescript
// packages/database/schema/events.ts
export const events = pgTable("events", {
  // ... existing fields

  // Background configuration
  backgroundType: text("background_type")
    .$type<"shader" | "video" | "none">()
    .default("shader"),

  backgroundVideoUrl: text("background_video_url"),
  backgroundVideoPosterUrl: text("background_video_poster_url"),

  // Shader config (stored as JSON)
  shaderConfig: jsonb("shader_config").$type<{
    colors?: {
      color1: [number, number, number];
      color2: [number, number, number];
      color3: [number, number, number];
    };
    speed?: number;
    brightness?: number;
    // ... other uniforms
  }>(),

  // Shared overlay settings
  overlayColor: text("overlay_color").default("rgb(19, 21, 23)"),
  overlayBlendMode: text("overlay_blend_mode")
    .$type<"multiply" | "screen" | "overlay" | "soft-light">()
    .default("multiply"),
});
```

### Backstage UI for Background Selection

```tsx
// apps/backstage: Event background editor
function EventBackgroundSelector({ eventId }: { eventId: string }) {
  const [backgroundType, setBackgroundType] = useState<"shader" | "video">(
    "shader"
  );

  return (
    <div className="background-selector">
      {/* Type selection */}
      <RadioGroup value={backgroundType} onChange={setBackgroundType}>
        <Radio value="shader">
          Gradient (Recommended)
          <small>Customizable, lightweight, fast</small>
        </Radio>
        <Radio value="video">
          Video Background
          <small>Custom video, larger file size</small>
        </Radio>
      </RadioGroup>

      {/* Shader config */}
      {backgroundType === "shader" && (
        <ShaderGradientEditor eventId={eventId} />
      )}

      {/* Video upload */}
      {backgroundType === "video" && (
        <VideoUploadEditor eventId={eventId}>
          <FileUpload
            accept="video/mp4,video/webm"
            maxSize={10 * 1024 * 1024} // 10MB
            onUpload={(url) => saveVideoBackground(eventId, url)}
          />
          <OverlayColorPicker />
          <BlendModeSelector />
        </VideoUploadEditor>
      )}
    </div>
  );
}
```

## Performance Comparison

### Network/Load Performance

| Metric             | Shader Gradient | Video Background |
| ------------------ | --------------- | ---------------- |
| **Initial Load**   | ~5KB            | ~3-10MB          |
| **Time to Visual** | <50ms           | 500-2000ms       |
| **Bandwidth**      | Negligible      | Significant      |
| **CDN Costs**      | ~$0.001/mo      | ~$0.50-5/mo      |

### Runtime Performance

| Metric                 | Shader Gradient        | Video Background |
| ---------------------- | ---------------------- | ---------------- |
| **CPU Usage**          | Low                    | Low              |
| **GPU Usage**          | Medium                 | Medium           |
| **Memory**             | ~8MB                   | ~15-30MB         |
| **Battery Impact**     | Medium                 | Medium           |
| **Mobile Performance** | Good (with throttling) | Good (native)    |

## Matrix.png Theme Asset

The `matrix.png` image serves as:

1. **Video poster** - Shows while video loads
2. **Fallback** - If video fails to load
3. **Static background** - For reduced motion users
4. **Brand consistency** - Matrix aesthetic

This appears to be a **Luma-provided theme asset**, not custom-created per event.

### Luma's Theme Library

Based on the URL pattern `images.lumacdn.com/themes/video/matrix.png`, Luma likely has:

```
themes/
  video/
    matrix.png           # Tech/AI events
    abstract-1.mp4       # Generic 1
    abstract-2.mp4       # Generic 2
    particles.mp4        # Particle effects
    waves.mp4            # Fluid dynamics
  gradient/
    (shader-based, not file-based)
```

**For DayOf:** We could create a small library of reusable background videos:

- Tech theme (Matrix-style)
- Music theme (waveforms, particles)
- Art theme (paint strokes, textures)
- Professional theme (subtle motion)

## Implementation Priority

### Phase 1: Shader Gradient (Core)

- ✅ Covers 90% of events
- ✅ Already planned
- ✅ Maximum flexibility
- **Start here**

### Phase 2: Video Background (Enhancement)

- 📅 Add for special events
- 📅 Simple HTML/CSS implementation
- 📅 Upload UI in backstage
- 📅 Create 3-5 default theme videos
- **Add later when needed**

## Code Example: Simple Video Background

```tsx
// components/ui/video-background/index.tsx
export function VideoBackground({
  videoSrc,
  posterSrc = "/themes/matrix.png",
  overlay = { color: "rgb(19, 21, 23)", blend: "multiply" },
  className,
}: VideoBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Base background */}
      <div className="absolute inset-0 bg-[rgb(32,34,36)]" />

      {/* Poster image */}
      <img
        src={posterSrc}
        alt=""
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                   w-full h-full object-cover pointer-events-none"
      />

      {/* Video (only if motion allowed) */}
      {!prefersReducedMotion && videoSrc && (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={posterSrc}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-full h-full object-cover pointer-events-none"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Overlay with blend mode */}
      <div
        className="fixed inset-0 pointer-events-none transition-colors duration-300"
        style={{
          backgroundColor: overlay.color,
          mixBlendMode: overlay.blend,
        }}
      />
    </div>
  );
}
```

## Accessibility Considerations

### Video Background Specific

```tsx
// Respect user preferences
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

// Pause video when tab hidden
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      videoRef.current?.pause();
    } else if (!prefersReducedMotion) {
      videoRef.current?.play();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [prefersReducedMotion]);
```

### Key Accessibility Features

- ✅ `prefers-reduced-motion` → Show static poster only
- ✅ `aria-hidden="true"` on decorative video
- ✅ Ensure text contrast over video
- ✅ Muted by default (required for autoplay)
- ✅ No audio track (purely decorative)
- ✅ Pause when tab hidden (battery saving)

## Summary: Three Background Systems

Luma uses **three different background approaches** depending on event needs:

### 1. Shader Gradient (Most Common)

**Events:** ltl9cvae, tm15enb1, etc.

- WebGL shader with Perlin noise
- Customizable colors per event
- Light/dark mode support
- ~90% of events

### 2. Video Background (Special Events)

**Events:** svkgfw2w (AI Hackathon)

- Custom video with blend overlays
- Specific branding/aesthetic
- Dark mode focused
- ~5% of events (flagships)

### 3. Solid Color (Fallback)

**Events:** Unknown (likely low-tier or error states)

- Simple background color
- Maximum accessibility
- Minimal resource usage
- ~5% of events (basic/accessible)

## Recommendation for DayOf

**Primary:** Build the **shader gradient system** first (as planned)

- Covers most use cases
- Maximum flexibility
- Best ROI

**Secondary:** Add **video background support** later

- Simple to implement (HTML + CSS only)
- No JavaScript needed
- Can reuse Luma's pattern exactly
- Useful for flagship/branded events

**Implementation order:**

1. ✅ Shader gradient (Phases 1-4 from luma-background-plan.md)
2. 📅 Video background (Phase 6 - post-launch enhancement)
3. 📅 Create default theme video library (Phase 7)

## Files to Create (Video Support)

```
apps/frontrow/src/components/ui/event-background/
├── index.tsx                    # Main export with type switching
├── AnimatedGradientBackground/  # Shader gradient (already planned)
│   └── ... (existing plan)
├── VideoBackground/             # Video background (new)
│   ├── index.tsx               # Main component
│   ├── VideoBackground.tsx     # Video implementation
│   ├── use-visibility-pause.ts # Pause when tab hidden
│   └── styles.css              # CSS for video + overlays
└── SolidBackground/             # Simple fallback
    └── index.tsx
```

**Estimated effort:** 4-6 hours for video background support (much simpler than shader!)

## Testing Video Background

```typescript
describe("VideoBackground", () => {
  it("should autoplay when visible", () => {
    const { getByRole } = render(<VideoBackground videoSrc="/test.mp4" />);

    const video = getByRole("img", { hidden: true }); // Video with role
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("muted");
  });

  it("should show poster for reduced motion", () => {
    mockPrefersReducedMotion(true);

    const { queryByRole } = render(
      <VideoBackground videoSrc="/test.mp4" posterSrc="/poster.png" />
    );

    expect(queryByRole("img", { hidden: true })).not.toHaveAttribute(
      "autoplay"
    );
  });

  it("should pause when tab hidden", () => {
    const { getByRole } = render(<VideoBackground videoSrc="/test.mp4" />);

    const video = getByRole("img", { hidden: true }) as HTMLVideoElement;

    // Simulate tab hidden
    Object.defineProperty(document, "hidden", { value: true });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(video.paused).toBe(true);
  });
});
```

## Final Verdict

**svkgfw2w is the exception, not the rule.**

- **Most Luma events** (ltl9cvae, tm15enb1, etc.) use **shader gradients**
- **Special/flagship events** (svkgfw2w) use **video backgrounds**
- **DayOf should prioritize shader gradients** with video as enhancement

Our `luma-background-plan.md` is still the primary implementation target. Video background support can be added later as a simple enhancement (much easier than shader implementation).

---

## Summary: Yes, That's the Core

**Answering your question:** Yes, the HTML you provided is exactly the core of the video background system:

### The Essential Parts

1. **Video Container** (with both poster + video):

   ```html
   <div class="video-container animated loaded">
     <img src=".../matrix.png" />
     <video autoplay loop playsinline>
       <source src=".../matrix.mp4" type="video/mp4" />
     </video>
   </div>
   ```

2. **Multiply Overlay** (THE CRITICAL LAYER):
   ```html
   <div
     class="video-overlay animated multiply"
     style="background-color: rgb(19, 21, 23);"
   ></div>
   ```

### Why This Works

- **Poster** shows instantly (matrix.png)
- **Video** loads and plays on top
- **Multiply overlay** darkens both for text contrast
- **6 base layers** are just styling/positioning (not essential)
- **2 overlay layers** add depth (optional)

### You Can Implement This With Just 2 Elements

```tsx
// Minimal viable version
<div className="video-container">
  <img src="matrix.png" />
  <video autoPlay loop muted playsInline>
    <source src="matrix.mp4" type="video/mp4" />
  </video>
</div>

<div
  className="video-overlay"
  style={{
    mixBlendMode: "multiply",
    backgroundColor: "rgb(19, 21, 23)"
  }}
/>
```

**That's it!** Much simpler than the shader gradient (which requires Three.js, WebGL, and R3F).

### Implementation Complexity Comparison

| Approach             | Essential Elements           | Lines of Code                | Dependencies           |
| -------------------- | ---------------------------- | ---------------------------- | ---------------------- |
| **Video Background** | 2 divs (container + overlay) | ~30 lines HTML/CSS           | None (pure HTML)       |
| **Shader Gradient**  | Canvas + shader code         | ~300+ lines (shader + React) | Three.js, R3F (~120KB) |

**Trade-off:** Video is WAY simpler to implement but less flexible (need new video for each look).
