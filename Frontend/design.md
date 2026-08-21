---
name: Midnight Archive
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#c4c1fb'
  on-secondary: '#2d2a5b'
  secondary-container: '#444173'
  on-secondary-container: '#b3afe9'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c4c1fb'
  on-secondary-fixed: '#181445'
  on-secondary-fixed-variant: '#444173'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-mobile: 16px
  container-padding-desktop: 40px
  gutter: 16px
  card-gap: 20px
---

## Brand & Style

This design system embodies a "Modern Otaku" aesthetic—a sophisticated, functional approach to media tracking that balances data density with atmospheric immersion. The personality is focused, nocturnal, and premium, moving away from cluttered "fan-site" tropes toward a refined digital archive.

The visual style is **Corporate Modern with a Cinematic Edge**. It utilizes a dark-mode-first approach with deep indigo foundations to evoke the feeling of late-night viewing sessions. High-contrast status accents provide immediate scannability, while subtle depth and clean typography ensure the interface remains a tool rather than a distraction. The UI should feel like a high-end personal dashboard: organized, responsive, and satisfying to curate.

## Colors

The palette is anchored in a "Nocturnal Foundation." 
- **Primary & Secondary:** Deep Indigo (`#1E1B4B`) serves as the container background, while a vibrant Violet (`#6366F1`) acts as the primary action color.
- **Accents:** Semantic colors are high-chroma to pierce through the dark backgrounds. Emerald is reserved for "Completed" states, Amber for active "Watching" states, and Coral for "Dropped" or "Alert" states.
- **Neutrals:** Cool-toned slates and grays are used for secondary information and borders to maintain the deep-sea atmosphere without losing legibility.

## Typography

The typography strategy prioritizes information density and technical precision.
- **Headings:** Hanken Grotesk provides a sharp, contemporary look with a slight "tech" personality that fits the modern otaku vibe.
- **Body:** Inter is used for all metadata, synopses, and lists due to its exceptional legibility at small sizes.
- **Labels:** JetBrains Mono is used sparingly for tags, episode counts, and technical metadata (e.g., "EP 12/24") to reinforce the "tracker" and "archive" nature of the system.

## Layout & Spacing

This design system utilizes a **Fluid Grid** model with strict 4px/8px increments. 
- **Desktop:** A 12-column grid with generous 40px side margins. Content is primarily organized in responsive card grids (2, 3, 4, or 6 columns depending on content type).
- **Mobile:** A 4-column grid with 16px margins. Media items switch to a vertical list or a 2-column "compact card" view.
- **Density:** Spacing between related metadata should be tight (4px-8px), while spacing between major content sections should be liberal (32px-48px) to provide visual breathing room in a data-heavy environment.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Subtle Glows** rather than heavy shadows.
- **Base Level:** Deep Navy (`#0F172A`) for the background.
- **Mid Level:** Surface containers use `#1E1B4B` with a 1px inner border (opacity 10% white) to define edges.
- **High Level:** Hovered cards or active modals use a subtle 8px blur shadow with a Primary Color (`#6366F1`) tint at 15% opacity, creating a "neon-light" lift effect.
- **Glassmorphism:** Navigation bars and detail overlays use a 12px backdrop blur with a 60% opaque background to maintain context of the underlying list while focused.

## Shapes

The shape language is **Soft yet Structured**. 
- Standard UI elements like inputs and buttons use a 0.25rem (4px) radius to maintain a professional, organized feel.
- Media posters and main content cards use a 0.5rem (8px) radius to feel slightly more approachable and modern.
- Status badges and "Currently Watching" indicators use a full pill-shape (100px) to distinguish them as interactive or high-status elements.

## Components

- **Buttons:** Primary buttons are solid Indigo (`#6366F1`) with white text. Secondary buttons are outlined with 1px borders. Interactive states should trigger a slight brightness increase rather than a color shift.
- **Status Chips:** High-contrast background with dark text or white text depending on contrast ratios. Example: "Completed" is Emerald green background with a deep forest green text.
- **Media Cards:** The core component. Features a high-quality poster image, a subtle bottom-to-top dark gradient overlay for title legibility, and a JetBrains Mono episode counter in the top right corner.
- **Input Fields:** Darker than the surface level (`#0F172A`), with a 1px border that glows Primary Violet when focused.
- **Progress Bars:** Thin 4px bars. The filled portion should use the Primary color or the Status color (e.g., Amber for "Watching").
- **Lists:** Clean rows with 1px dividers. Use JetBrains Mono for all numeric data (scores, dates, episode counts) to ensure vertical alignment in tables.
