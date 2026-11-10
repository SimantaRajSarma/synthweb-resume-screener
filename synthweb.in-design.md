---
version: alpha
name: SynthWeb Bluewave
description: A clean, high-trust consulting system with bright blue accents and spacious editorial hierarchy.
colors:
  primary: "#137CC8"
  primary-60: "#1479C7"
  primary-10: "#EAF3FC"
  secondary: "#083251"
  tertiary: "#F5E68A"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  muted-surface: "#EAF3FC"
  on-surface: "#083251"
  text: "#083251"
  error: "#C62828"
typography:
  headline-display:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "60px"
    fontWeight: 600
    lineHeight: "60px"
    letterSpacing: "-1px"
  headline-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "44px"
    letterSpacing: "0px"
  headline-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "26px"
    letterSpacing: "0px"
  headline-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
    letterSpacing: "0px"
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "0px"
  body-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
    letterSpacing: "0px"
  label-lg:
    fontFamily: "Inter Tight"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
    letterSpacing: "0px"
  label-md:
    fontFamily: "Inter Tight"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0px"
  label-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "22px"
    letterSpacing: "1.68px"
  nav-link:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
    letterSpacing: "0px"
  stat-value:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-1px"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 2px
  sm: 10px
  md: 18px
  lg: 26px
  xl: 60px
  gutter: 24px
  section: 60px
components:
  button-primary:
    backgroundColor: "{colors.primary-60}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
    height: "45px"
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
    height: "45px"
  button-secondary:
    backgroundColor: "{colors.primary-10}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
    height: "45px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
    height: "45px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "22px 26px 20px"
  stat-card:
    backgroundColor: "{colors.primary-10}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "18px"
  nav-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    height: "70px"
  floating-chat:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
    padding: "14px 20px"
---

# SynthWeb Bluewave

## Overview
SynthWeb feels polished, capable, and reassuring rather than flashy. The site is aimed at business owners and product teams looking for a technical partner with enough maturity to handle launch, scaling, and ongoing delivery. The emotional tone is bright and confident, with plenty of white space and crisp blue accents that keep the interface feeling airy and trustworthy.

## Colors
- **Primary (#137CC8):** A vivid service blue used for key actions, icons, counters, and brand emphasis. It gives the interface energy without overwhelming the page.
- **Secondary (#083251):** A deep navy used for body copy, strong section backgrounds, and high-contrast dark panels. It anchors the brand and adds a serious, technical tone.
- **Tertiary (#F5E68A):** A soft warm highlight used sparingly for emphasis, badges, and subtle accent moments. It adds human warmth against the blue-and-white system.
- **Surface (#FFFFFF):** The main canvas color for the site. Most content sits on pure white, which keeps the layout clean and readable.
- **Muted Surface (#EAF3FC):** A pale blue panel color used for secondary buttons and metric cards. It creates gentle tonal separation without heavy borders.
- **On-Surface / Text (#083251):** The default text color for paragraphs, navigation, and supporting content. It reads clearly against the white background and reinforces the brand’s navy core.
- **Error (#C62828):** A conventional alert red reserved for validation and destructive states. It is not prominent in the screenshot, so it should remain minimal.

## Typography
The system is built primarily on **Plus Jakarta Sans**, which gives the brand a modern, rounded, and highly readable voice. Headlines use 600 weight with a compact structure; the hero headline is large, bold, and tightly leadinged to create immediate impact, while supporting headings step down cleanly in scale. Body text stays lighter and more open, with 14px and comfortable line height for long-form explanations.

A secondary utility voice appears in **Inter Tight** for action labels and compact UI text, especially buttons and stat treatments. Small uppercase or tracking-heavy text is used for section kicker labels, and the `label-sm` token captures the visible spaced-out style used in process headings. Navigation and interface labels should remain crisp and restrained, with no decorative typography.

## Layout
The layout is spacious and editorial, with a centered page container and a strong two-column hero structure. Content is aligned to a wide fixed-max-width feel rather than a dense fluid grid, allowing text and imagery to breathe. Large vertical separation between sections reinforces a premium consulting presentation and keeps the page easy to scan.

Spacing follows a simple stepped rhythm: very small 2px adjustments for fine alignment, then 10px, 18px, 26px, and large 60px section gaps. Cards and metrics use compact internal padding, while major sections rely on generous outer margins and whitespace. In practice, the page should feel open, with clear gutters and controlled horizontal density.

## Elevation & Depth
The system is mostly flat, relying on contrast, tonal panels, and image framing rather than dramatic shadows. White surfaces dominate, while pale blue cards create low-contrast layers that separate content without visual noise. The dark process band at the bottom introduces strong depth through color inversion instead of shadow.

Shadows, when used, should be subtle and functional, reserved for floating or emphasized elements such as the chat control. The design avoids glassmorphism, heavy blur, and layered depth stacks. Borders are minimal and clean, with the strongest contrast coming from color blocking and image composition.

## Shapes
The overall shape language is modest and approachable. Corners are mostly small and consistent, centered around a 4px radius for buttons and cards. This creates a professional, engineered feel rather than a soft consumer-product aesthetic.

Rounded pills are reserved for floating utility elements like the chat button. Most other elements should stay close to square, with only enough rounding to keep interactive controls friendly and modern.

## Components
**Buttons:** Primary buttons use solid blue backgrounds with white text, medium weight labels, and a compact height around 45px. Secondary buttons use the pale blue surface treatment with blue text to signal lower emphasis. The visual hierarchy should remain clear: use `button-primary` for the main CTA, `button-secondary` for supporting actions, and `button-link` for text-only actions. Hover states should deepen the blue tone and remain borderless and clean.

**Navigation:** The nav bar is minimal, white, and horizontally balanced, with simple text links and small disclosure indicators for menu groups. Navigation should stay lightweight and avoid heavy chrome. Active or emphasized items should use the brand blue rather than decorative underlines.

**Cards:** Content cards are soft, rectangular containers with light backgrounds and restrained padding. Metric cards specifically use the `stat-card` treatment: pale blue fill, compact spacing, and strong numerals paired with small labels. Cards should prioritize readability over decoration, with minimal borders and no noisy shadows.

**Hero Media:** Large image blocks should feel integrated into the layout, not simply pasted in. The diagonal crop and generous scale of the hero photo suggest that imagery can be used as a strong compositional anchor, but should always remain crisp and well-framed.

**Inputs:** Inputs are not prominently visible in the screenshot, so they should follow the same restrained language as buttons and cards: white or pale surfaces, small radius, clear navy text, and blue focus states. Keep borders subtle and avoid oversized form chrome.

**Chips / Badges:** Small section labels and counters should use compact uppercase or tightly tracked label text in the brand blue or warm accent. These should stay lightweight and informational, not decorative.

**Floating actions:** The chat launcher uses a rounded pill shape, strong blue fill, white text, and a high-visibility placement in the lower corner. Floating utility components should always remain clearly differentiated from primary page content.

## Do's and Don'ts
- Do keep the interface spacious, with generous whitespace around major hero content and section bands.
- Do use blue as the primary action and emphasis color, with navy reserved for text and dark section anchors.
- Do keep buttons and cards compact, rectangular, and only lightly rounded.
- Do use clear typographic hierarchy: bold large headlines, restrained body copy, and compact utility labels.
- Don't introduce heavy gradients, glass effects, or ornate shadows.
- Don't overuse the warm accent; it should support emphasis, not compete with the blue brand.
- Don't make navigation or cards visually busy; the system depends on clarity and restraint.
- Don't mix in rounded consumer-app styling that would weaken the professional consulting tone.