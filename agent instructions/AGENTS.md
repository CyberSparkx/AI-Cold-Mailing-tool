# AGENTS.md: Build websites that don't look AI-generated

This file applies to every task that creates or changes UI: pages, sections, components, dashboards, landing pages, apps.

The goal is simple. The result must look like a designer made specific choices for this brief, not like the average of every AI-generated site. Generic output is a failure, even when it works.

Follow the phases in order. Do not skip to writing code.

---

## 0. Ground rules

1. **The user's brief wins.** If the user names a style, palette, font, or library, use it, even if it conflicts with this file.
2. **Skills and libraries are tools, not the design.** Installing a skill or component library does not make a site good. Choosing, combining, and customizing does.
3. **Never ship a component as-is.** Every component pulled from a library must be customized (see Phase 4).
4. **Ask before doing anything costly or sensitive.** This means paid plans, license keys, global installs, installing system software (Python, Node), or anything that needs the user's login. Never invent, hardcode, or commit keys or tokens.
5. **Don't repeat setup.** Check if a skill, MCP server, or registry is already installed before installing it.

---

## 1. Phase 1: Setup (skills and tools)

### 1.1 Install the skills

Check the agent's skills folder first (for example `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`). Install only what is missing, at project level unless the user asks for global.

| Skill | Install | Purpose |
|---|---|---|
| **taste-skill** | `npx skills add Leonxlnx/taste-skill` | Taste and anti-generic design rules |
| **ui-ux-pro-max** | `npm install -g ui-ux-pro-max-cli`, then `uipro init --ai <your-agent>` (use `universal` if unsure). Or `npx ui-ux-pro-max-cli init --ai <your-agent>` | Design system generator: styles, palettes, font pairings, UX rules, stack guidelines |
| **GSAP skills** | `npx skills add greensock/gsap-skills` (source: https://github.com/greensock/gsap-skills/tree/main/skills) | Correct GSAP patterns: tweens, timelines, ScrollTrigger, React (`useGSAP`), cleanup |
| **Extra skills** (optional) | Browse https://github.com/ComposioHQ/awesome-claude-skills | Only add a skill if it directly helps the current task |

Notes:
- `awesome-claude-skills` is a **list**, not a skill. Do not install the whole thing. Pick at most one or two relevant entries, and read their `SKILL.md` before installing them.
- `ui-ux-pro-max` needs **Python 3** for its search script. If `python3 --version` fails, **stop and ask the user to install it**. Do not install Python yourself.
- If an install command fails (renamed repo, changed CLI, network block), tell the user which one failed and continue with the skills that did install. Do not make up a replacement command.

### 1.2 Connect the component sources

Use an MCP server or registry when one is available. If not, use the library's docs and copy the component source.

| Source | What it is | Setup | Cost and access |
|---|---|---|---|
| **shadcn/ui** | Standard accessible primitives (Button, Dialog, Tabs, Form, Table...) | `npx shadcn@latest mcp init --client <your-client>` (docs: https://ui.shadcn.com/docs/mcp). Registries are listed in `components.json` | Free |
| **Aceternity UI** | Animated and visual components (spotlights, bento grids, parallax, 3D cards) | https://ui.aceternity.com/components. Follow the install command on each component page | Free tier plus paid pro |
| **React Bits Pro** | 150 animated components, shader and 3D backgrounds, cursor effects, blocks | https://pro.reactbits.dev/docs/components. MCP: https://pro.reactbits.dev/docs/mcp. Needs `REACTBITS_LICENSE_KEY` in `.env.local` and the `@reactbits-starter` / `@reactbits-pro` registries in `components.json` | Paid license. Ask the user for the key. Do not guess |
| **21st.dev** | Large community catalog of React components | https://21st.dev/mcp (CLI and MCP). Search is free and installs are capped per day on the free plan | Free tier with limits. Login or API key needed |
| **ThreeUI** | Three.js / 3D components and templates | https://threeui.com/mcp (authenticated MCP) | Pro membership needed for the MCP. Ask the user |

Rules:
- If a source needs a license or login the user hasn't provided, **skip it and use the next source.** Tell the user what you skipped and why.
- Don't install all libraries into the project "just in case." Only install components you actually use.
- Use the library's own docs or MCP to get real component names. Never guess component names or registry slugs.

---

## 2. Phase 2: Read, then plan (before any code)

1. **Read every installed `SKILL.md` fully.** Do not skim. Follow their instructions as written.
2. **Identify the subject.** Write down in one sentence each: what this is, who it's for, and the page's single main job. If the brief doesn't say, propose an answer and confirm with the user.
3. **Generate the design system.** With `ui-ux-pro-max`, run its design-system command for this product type and save it (for example `design-system/<project>/MASTER.md`, with page overrides under `pages/`). Reuse this file in later tasks so the site stays consistent.
4. **Write a short design plan** and keep it in the repo or in your reply:
   - **Color:** 4 to 6 named hex values, with roles.
   - **Type:** one or two families and what each is for, plus a type scale.
   - **Layout:** one sentence plus a rough ASCII wireframe of the hero and one other section.
   - **Signature moment:** the **one** memorable thing (an animated hero, a 3D object, a scroll sequence). Everything else stays quiet.
   - **Motion plan:** what moves, why, and with which tool (CSS, Motion, GSAP, Three.js).
5. **Check the plan against the brief.** Ask: "If I gave a similar prompt for a different company, would I arrive at this same plan?" If yes, change it and say what you changed.

Only after step 5 do you write code.

---

## 3. Phase 3: Choose components (the ladder)

Go down this list. Stop at the first level that does the job well.

1. **Primitives from shadcn/ui** for anything functional: forms, dialogs, menus, tables, tabs, tooltips, toasts. These are for behavior and accessibility, so don't hand-build them.
2. **Animated or styled components from Aceternity, React Bits, or 21st.dev** for sections that carry the design: hero, backgrounds, feature showcases, text effects, cards, galleries, cursor effects.
3. **3D from ThreeUI or React Bits (3D & Shaders)** only when 3D is part of the concept. Examples: a product viewer, a globe, a spatial hero. Not as decoration.
4. **Custom code** when nothing fits. Use GSAP for scroll-driven sequences and timelines, and CSS for simple transitions.

Constraints:
- **Mix sources deliberately.** Don't build a page by stacking one component from each library. Pick 1 or 2 libraries for the animated layer and use them with restraint.
- **One signature moment per page.** If you pick an animated shader background, don't also add a 3D hero, a cursor effect, a marquee, and scroll-jacking.
- **Use the right tool for motion.**
  - Micro-interactions and simple entrances: CSS or Motion.
  - Timelines, scroll scrubbing, pinning, complex sequences: GSAP (`gsap`, `@gsap/react`, ScrollTrigger), following the GSAP skill.
  - 3D: Three.js or React Three Fiber via ThreeUI or React Bits components.
- **Check the dependency cost.** Before adding a heavy component (Three.js, shaders), confirm it's worth it. Lazy-load it and give it a static fallback.

---

## 4. Phase 4: Customize every component (mandatory)

A library component left at its defaults is the clearest sign of an AI-generated site. Before a component is done, all of these must be true:

- [ ] **Tokens:** colors, fonts, radius, spacing, and shadows come from the project's design tokens (CSS variables or Tailwind theme), not the component's hard-coded values.
- [ ] **Typography:** set in the project's chosen fonts and type scale. Headline treatment matches the brief.
- [ ] **Shape language:** radius and borders follow one system. Not the same radius on everything, and not whatever each component shipped with.
- [ ] **Motion:** duration, easing, and trigger tuned to the project. Demo-speed animation (too fast or too floaty) is reduced or removed.
- [ ] **Content:** all demo text, images, logos, names, and numbers replaced with real or realistic content for this brief. No "Lorem ipsum", no component-demo copy, no stock "Acme Inc".
- [ ] **Structure:** remove parts of the component the page doesn't need. Combine or restructure where it makes the layout more specific.
- [ ] **Props and colors exposed:** shader, gradient, and particle colors are set to the palette, not left at the demo rainbow.
- [ ] **Icons:** one icon set, consistent stroke and size. No emojis used as icons.
- [ ] **Accessibility kept:** focus states, keyboard support, and ARIA from primitives are still intact after restyling.

If a component cannot be made to fit the design, **drop it.** Don't compromise the design to keep a component.

---

## 5. The AI-slop blacklist

Do not produce these unless the user explicitly asks for them.

**Layout and visuals**
- Centered hero with a gradient-text headline, a subline, and two buttons (primary and ghost), every time.
- Purple-to-blue or pink gradients as default decoration. Gradient washes behind everything.
- Near-black background with a single neon accent as the default "premium" look.
- Warm cream background, high-contrast serif headlines, and a terracotta accent as the default "editorial" look.
- Content chopped into identical rounded cards with the same soft shadow. One radius on everything.
- Glassmorphism, blur, and glow on every surface.
- Bento grid used because it's trendy, not because the content is that shape.
- Floating blurred blobs and orbs as filler.

**Typography and labels**
- Inter, Roboto, or system-ui as the only typeface with no deliberate choice.
- Highlighting one word in a headline with a color, gradient, or italic.
- Tracked-out ALL-CAPS eyebrow label above every heading.
- Numbered markers (01 / 02 / 03) on content that isn't a sequence.
- Monospace for small labels everywhere. Arrows ("→") appended to every link and button.

**Content**
- Fake testimonials, fake logos, fake stats, fake "Trusted by 10,000+ teams". Use real content or clearly mark placeholders for the user to replace.
- Buzzwords and filler: "Unleash", "Elevate", "Seamless", "Revolutionize", "Supercharge", "Next-generation", "all-in-one platform".
- Generic CTAs like "Get Started" or "Submit" when a specific action can be named ("Book a fitting", "Save changes").

**Motion**
- Fade-and-slide-up on every section and hover lift on every card.
- Multiple competing animated effects on the same screen.
- Scroll-jacking, or motion that blocks reading or navigation.

---

## 6. Motion and 3D rules

- **Spend motion in one place.** One orchestrated page-load or hero moment beats scattered effects. Motion that answers a user action (open, expand, confirm) is always fine.
- **Respect `prefers-reduced-motion`.** Provide a reduced or static version for every animation, including GSAP timelines and canvas/WebGL effects.
- **GSAP in React:** use `useGSAP` from `@gsap/react` with a scope, so animations clean up on unmount. Register plugins once. Kill ScrollTriggers and revert contexts on cleanup.
- **Animate cheap properties.** Use `transform` and `opacity`. Don't animate `width`, `height`, `top`, or `left`.
- **3D and shaders:**
  - Lazy-load the canvas and show a static poster image while it loads.
  - Cap device pixel ratio (around 2) and pause rendering when offscreen.
  - Provide a fallback for devices without WebGL, and for low-power or mobile devices where needed.
  - Never put a full-screen 3D scene behind long text without checking legibility.
- **No animation on the critical text path.** Headlines and primary content must be readable without waiting for an animation.

---

## 7. Conflict order

When instructions disagree, follow this order (first wins):

1. The user's explicit brief
2. The project's saved design system (`MASTER.md` and page overrides)
3. `taste-skill` and `ui-ux-pro-max` rules
4. GSAP skill rules (for animation implementation)
5. Component library defaults and demo code

---

## 8. Definition of done

Before telling the user the work is finished, verify each item. Use screenshots or a browser run if the environment supports it.

- [ ] Responsive at 375, 768, 1024, and 1440 px wide. No horizontal scroll, no clipped or overlapping text.
- [ ] Visible keyboard focus. Everything interactive is reachable by keyboard.
- [ ] Text contrast is at least 4.5:1 (3:1 for large text).
- [ ] `prefers-reduced-motion` is handled.
- [ ] No console errors. No layout shift from late-loading fonts, images, or canvases.
- [ ] Heavy components are lazy-loaded. No unused libraries or components left in the project.
- [ ] No demo content, no lorem ipsum, no placeholder brand names left in.
- [ ] Only one signature moment. Everything else is quiet.
- [ ] Self-critique pass: look at the result once more and **remove one thing** (a decoration, an effect, a label) that isn't earning its place.
- [ ] Blacklist check (Section 5). If any item appears, fix it.

---

## 9. Final report to the user

End each UI task with a short summary:

1. The design direction in one or two sentences (subject, palette, type, signature moment).
2. Which skills and libraries were used, and for what.
3. Anything skipped and why (missing license, failed install, component dropped).
4. Anything the user needs to provide (real copy, images, logos, keys).

Keep it short. Don't list every file.

---

## Reference links

- taste-skill: `npx skills add Leonxlnx/taste-skill`
- UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- GSAP skills: https://github.com/greensock/gsap-skills/tree/main/skills
- Awesome Claude Skills: https://github.com/ComposioHQ/awesome-claude-skills
- shadcn MCP: https://ui.shadcn.com/docs/mcp
- React Bits Pro: https://pro.reactbits.dev/docs/components
- Aceternity UI: https://ui.aceternity.com/components
- 21st.dev MCP: https://21st.dev/mcp
- ThreeUI MCP: https://threeui.com/mcp
