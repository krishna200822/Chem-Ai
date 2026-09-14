# Complete and fix ChemAI frontend

## Scope
- Preserve ChemAI as a simple static `index.html`, `style.css`, and `script.js` frontend.
- Keep the existing production backend contract unchanged: `POST https://clgchemproject.onrender.com/predict` with `reactants` and `conditions`.
- Replace the template page at `/` with the completed static experience so it works in the local preview and after deployment.

## Implementation
1. **Rebuild the existing screen structure without removing its features**
   - Keep the sidebar workspace model and add the missing Overview destination.
   - Build complete in-page views for Overview, Predict Reaction, Reaction Library, Saved Results, Learning Hub, and About ChemAI.
   - Keep navigation instant, update active states and page labels, and add a compact mobile menu.

2. **Finish the prediction workflow**
   - Preserve reactant input, character count, examples, clear/reset, prediction, copy, save, and new-analysis actions.
   - Add the optional conditions field and send both required JSON keys.
   - Prevent duplicate submissions, disable controls while running, cycle through clear analysis status messages, and support Render cold-start wait times.
   - Map HTTP 400, 404, 429, 500, 502, 503, 504, invalid JSON, timeout, and network failures to readable recovery messages.

3. **Render the complete backend response**
   - Normalize top-level or nested aliases for reaction type/equation, reactants, products, pathways, mechanism, conditions, thermodynamics, kinetics, observations, safety, limitations, confidence, and summary.
   - Render only available fields while preserving all returned nested information as readable labeled content—never raw JSON or `[object Object]`.
   - Add responsive equation, reactant, product, pathway-flow, mechanism-step, scientific-data, confidence, observations, limitations, and safety sections.
   - Do not invent chemistry values or structures when data is absent.

4. **Complete saved results and utilities**
   - Preserve the existing `chemAI_saved` localStorage data and tolerate malformed/older entries.
   - Add saved-result list, open, and delete actions plus clear user notifications.
   - Copy the normalized equation correctly with a clipboard fallback; copy analysis as readable text rather than JSON.

5. **Apply the requested scientific visual system**
   - Use a high-contrast deep navy interface with restrained cyan, blue, violet, green, and amber accents.
   - Replace the stock photo with lightweight inline chemistry SVG/CSS: molecule network, atom orbits, bonds, formulas, particles, benzene motifs, product thumbnails, pathway flow, and scientific indicators.
   - Add subtle motion and loading effects with reduced-motion support; keep mobile visuals simplified but present.
   - Improve text size, contrast, focus states, semantic labels, live status announcements, and formula wrapping across desktop, tablet, and mobile.

## Validation
- Confirm only one external `script.js` application entry and one production `API_BASE_URL`; no localhost API references or secrets.
- Check JavaScript syntax and every DOM selector/action.
- Exercise navigation, examples, clear, loading lock, the real API call, all returned result sections, saved-result open/delete, copy equation, and notifications.
- Test desktop and mobile layouts for overflow, readable formulas, visible sidebar/menu behavior, and accessible contrast.
- Check the browser console, network request payload/endpoint, and current build diagnostics before completion.
