# Repository Guidelines

## Project layout
- `dragon_gym/` hosts the single-page simulator UI:
  - `index.html` wires the DOM and imports `styles.css` and `app.js` directly without a bundler.
  - `styles.css` contains all layout and visual design rules.
  - `app.js` holds the workout simulation logic, DOM interactions, and drawing utilities for the gauges.
- Static assets (SVGs, images) live under `dragon_gym/assets/`.

## Coding style
- Follow the prevailing two-space indentation in HTML, CSS, and JavaScript files.
- Stay with vanilla JavaScript—do not introduce build steps, third-party frameworks, or module systems.
- Prefer `const` for values that are not reassigned and `let` otherwise; avoid `var` entirely.
- Keep helper functions defined at top level (function declarations) like the existing utilities unless a closure or factory pattern is needed.
- When extending DOM lookups, add new IDs or classes to the central `elements` map in `app.js` and gate DOM operations with null checks as shown.
- Preserve accessibility attributes (`aria-*`, `role`, live regions) when adjusting markup.

## CSS conventions
- Reuse existing custom properties (`--accent`, `--card-radius`, etc.) before adding new colors or sizes.
- Keep selectors scoped to existing structural classes (e.g., `.motor-card`, `.status-card`) and prefer modifiers (`.is-locked`) over deeply nested selectors when toggling state from JavaScript.
- Maintain responsive behavior—leverage `clamp()` and flex/grid utilities consistent with the current layout.

## Testing & validation
- Run `node --check dragon_gym/app.js` after JavaScript changes to verify syntax.
- For visual tweaks that do not affect JavaScript logic, mention when tests are intentionally skipped.
- Run all available tests after every change.

## Git & PR hygiene
- Group related changes per feature/fix and keep commit messages descriptive.
- Update documentation or inline comments if behavior changes in a way that future contributors should know.
