---
name: Vienna Connect
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 20px
  stack-gap-sm: 8px
  stack-gap-md: 16px
  stack-gap-lg: 24px
  section-margin: 40px
---

## Brand & Style
The design system embodies a "Modern European Athleticism"—a synthesis of premium curation and functional precision. It targets the active, urban demographic of Vienna, moving away from aggressive "gym-bro" aesthetics toward a lifestyle-oriented, sophisticated digital community.

The visual style is a hybrid of **Minimalism** and **Glassmorphism**. It leverages expansive white space to create a sense of calm, using translucent layers to imply depth and hierarchy without clutter. Every interaction should feel intentional, quiet, and high-end, mirroring the experience of a luxury concierge or a well-designed architectural space.

## Colors
The palette is rooted in a "Midnight and Mist" theme. The **Deep Midnight Blue** serves as the anchor for all primary actions and high-level branding, providing a sense of authority and trust. **Modern Teal** is used for secondary interactive elements, offering a fresh, athletic energy that isn't overwhelming.

**Warm Amber** is used sparingly—only for critical highlights, notifications, or "Gold" tier status elements to maintain its premium impact. The background uses a **Soft White (#FAFAFA)** to reduce eye strain compared to pure white, while interactive cards use **Pure White** to pop forward using elevation.

## Typography
The typographic hierarchy is designed for an editorial feel. **Hanken Grotesk** provides a sharp, contemporary edge for headlines, reminiscent of high-end tech interfaces. **Inter** handles the body copy for maximum legibility across dense community threads and event descriptions.

**Geist** is reserved for labels, metadata, and technical details, providing a monospaced-adjacent precision that balances the softer humanist fonts. Tighten tracking on large display text to emphasize the "Linear-esque" precision, while increasing leading on body text for an airy, readable "Notion-like" comfort.

## Layout & Spacing
This design system utilizes an **8px base grid** with 4px sub-steps for fine-tuned alignment. For mobile layouts, a consistent **20px horizontal margin** is maintained to provide breathing room and prevent content from feeling "trapped."

Vertical rhythm is driven by purposeful white space; sections should be separated by a minimum of 40px to reinforce the premium, unhurried feel. Content blocks utilize dynamic padding (16px to 24px) to ensure that text never feels crowded against the edges of its container.

## Elevation & Depth
Depth is communicated through **Ambient Shadows** and **Glassmorphism**. 

1.  **Level 0 (Background):** Soft White (#FAFAFA).
2.  **Level 1 (Cards/Modules):** Pure White with a 1px subtle stroke (#E2E8F0) and a soft, large-radius shadow (Y: 4, Blur: 20, Opacity: 0.04).
3.  **Level 2 (Floating/Modals):** Glassmorphic surfaces using a backdrop blur (20px) and 80% opacity white fill. These should have a slightly more pronounced shadow (Y: 10, Blur: 30, Opacity: 0.08).

Avoid harsh, black shadows. Shadows should be tinted with the Primary color (Midnight Blue) at extremely low opacities to maintain a natural, cohesive look.

## Shapes
The shape language is generous and friendly. A standard border radius of **16px** is used for most UI components (cards, large buttons, inputs), while larger containers like bottom sheets or featured hero cards should use **24px**. Small elements like tags or chips should use a fully rounded (pill-shaped) radius to contrast against the more structured container shapes.

## Components
-   **Buttons:** Primary buttons are solid Deep Midnight Blue with 16px corner radius and white Inter Medium text. Secondary buttons use a subtle Teal tint with 10% opacity or a simple ghost outline.
-   **Cards:** Pure white surfaces, 16px-24px padding, and 20px corner radius. Grouped content within cards should use the 8px grid for internal spacing.
-   **Input Fields:** Minimalist design with a 1px #E2E8F0 border. On focus, the border transitions to Modern Teal with a soft glow (outer shadow).
-   **Chips/Tags:** Used for sports categories (e.g., "Tennis", "Cycling"). These use a light neutral background and Geist for the label font to feel like metadata.
-   **Lists:** High-contrast typography with generous 16px vertical padding between items. Use subtle dividers (#F1F5F9) that do not span the full width of the screen.
-   **Navigation:** An iOS-inspired bottom tab bar using glassmorphism (backdrop blur) to allow content to peek through, creating a sense of continuity.