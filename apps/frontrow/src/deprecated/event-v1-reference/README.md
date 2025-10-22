# Event V1 Reference (Deprecated)

## Why Deprecated

This directory contains the legacy event page implementation that has been deprecated as of 2025-10-19.

### Technical Reasons

1. **CSS Modules Conflict**: Used `styles.module.css` which conflicts with the new Tailwind v4 + semantic token system
2. **Theme System Incompatibility**: Did not support per-event scoped theme overrides using the `.event-{id}` pattern
3. **Single-Segment Route**: Used `/event/$eventName` instead of the new `/$orgHandle/$eventHandle` multi-org structure
4. **Non-Compliant Components**: Mixed vendor-wrapped and non-wrapped UI components inconsistently

### What Was Moved

- `routes/event.$eventName.tsx` - Old event route using single-segment pattern
- `features/event/**` - All event feature components including:
  - `components/` - AsideInfoNote, CTAPanel, GetAppSection, LineupSection, etc.
  - `styles.module.css` - CSS modules stylesheet
  - `index.tsx` - Main EventPage component

## Migration Path

See `MIGRATION-NOTES.md` for detailed component mapping and migration guidance.

## Preservation Purpose

This code is preserved for reference during the rewrite process. Key patterns to preserve:
- Responsive layout behavior
- Section structure (Hero, About, Lineup, Venue, etc.)
- Accessibility patterns
- User interactions

Do NOT copy CSS modules or hardcoded theme values. Use semantic tokens instead.
