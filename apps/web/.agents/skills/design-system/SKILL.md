---
name: design-system
description: Token architecture and component specifications. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typography scales, component specs. Use for design tokens, systematic design, brand-compliant styles.
argument-hint: '[component or token]'
license: MIT
metadata:
  author: claudekit
  version: '1.0.0'
---

# Design System

Token architecture, component specifications, and systematic design.

## When to Use

- Design token creation
- Component state definitions
- CSS variable systems
- Spacing/typography scales
- Design-to-code handoff
- Tailwind theme configuration

## Token Architecture

Load: `references/token-architecture.md`

### Three-Layer Structure

```
Primitive (raw values)
       ↓
Semantic (purpose aliases)
       ↓
Component (component-specific)
```

**Example:**

```css
/* Primitive */
--color-blue-600: #2563eb;

/* Semantic */
--color-primary: var(--color-blue-600);

/* Component */
--button-bg: var(--color-primary);
```

## Script Paths

Script paths in this skill and its `references/` are relative to the directory that contains this SKILL.md, not to the project: `scripts/<file>` is this skill's own `scripts/` folder, and `../<skill>/scripts/<file>` is a sibling sub-skill installed alongside it. Build the full path from that directory and keep the working directory at the project root.

## Quick Start

**Generate tokens:**

```bash
node scripts/generate-tokens.cjs --config tokens.json -o tokens.css
```

**Validate usage:**

```bash
node scripts/validate-tokens.cjs --dir src/
```

## References

| Topic                | File                                 |
| -------------------- | ------------------------------------ |
| Token Architecture   | `references/token-architecture.md`   |
| Primitive Tokens     | `references/primitive-tokens.md`     |
| Semantic Tokens      | `references/semantic-tokens.md`      |
| Component Tokens     | `references/component-tokens.md`     |
| Component Specs      | `references/component-specs.md`      |
| States & Variants    | `references/states-and-variants.md`  |
| Tailwind Integration | `references/tailwind-integration.md` |

## Component Spec Pattern

| Property   | Default | Hover        | Active         | Disabled     |
| ---------- | ------- | ------------ | -------------- | ------------ |
| Background | primary | primary-dark | primary-darker | muted        |
| Text       | white   | white        | white          | muted-fg     |
| Border     | none    | none         | none           | muted-border |
| Shadow     | sm      | md           | none           | none         |

## Scripts

| Script                    | Purpose                             |
| ------------------------- | ----------------------------------- |
| `generate-tokens.cjs`     | Generate CSS from JSON token config |
| `validate-tokens.cjs`     | Check for hardcoded values in code  |
| `embed-tokens.cjs`        | Embed tokens into files             |
| `html-token-validator.py` | Validate HTML for token compliance  |

## Templates

| Template                     | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `design-tokens-starter.json` | Starter JSON with three-layer structure |

## Best Practices

1. Never use raw hex in components - always reference tokens
2. Semantic layer enables theme switching (light/dark)
3. Component tokens enable per-component customization
4. Use HSL/OKLCH format for opacity control
5. Document every token's purpose
