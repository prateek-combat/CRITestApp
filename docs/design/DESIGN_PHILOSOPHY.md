CRITest Design Philosophy
=========================

Purpose
-------
CRITest is a control surface for high-stakes assessment. The design must feel
authoritative, calm, and evidence-first. The interface should reduce noise,
highlight signals, and keep decisions defensible without feeling cold.

Visual Tone
-----------
- Editorial and archival: clean structure with subtle texture, like a well kept
  dossier.
- Quiet confidence: strong hierarchy, restrained motion, no gimmicks.
- Trustworthy and human: warm neutrals, clear status cues, generous spacing.

Color System
------------
Core palette uses CSS tokens so all surfaces can shift together.

- ink: primary text and structural UI
- parchment: base background and card surfaces
- copper: attention and call to action
- moss: stability and success
- slateblue: analytical accents

Guidelines
----------
- Use ink for primary text and borders.
- Use parchment for page backgrounds and card bodies.
- Use copper sparingly for primary actions or priority signals.
- Use moss for positive status and compliance indicators.
- Use slateblue for data or analytics highlights.

Typography
----------
- Display: Newsreader for headlines and section labels.
- Body: Space Grotesk for UI text and controls.
- Mono: JetBrains Mono for data, IDs, or timestamps.

Hierarchy should be explicit: uppercase micro labels, strong H1s, compact
subtitles.

Layout Principles
-----------------
- Prefer compositional grids with clear left-to-right flow.
- Group content into framed panels (cards) with subtle borders and shadows.
- Use callout sidebars for operational signals and summary metrics.

Motion
------
- Motion should be atmospheric and slow, not attention seeking.
- Respect reduced motion preferences and collapse animations to static states.
- Use subtle entrance fades and minimal hover lifts.

Components
----------
- Buttons: flat ink with parchment text for primary; outlined ink for secondary.
- Cards: parchment surfaces with ink borders and soft depth.
- Tables: structured grids with gentle row hovers and visible column labeling.
- Badges: low-saturation fills with ink text; never use neon tones.

Voice & Copy
------------
- Prefer verbs that signal control and clarity: "Review", "Verify", "Decide".
- Avoid hype. Write for responsible operators.
- Emphasize evidence, integrity, and speed without overstating claims.
