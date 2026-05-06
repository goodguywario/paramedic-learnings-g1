# What to notice in `feature-design`

## Pattern demonstrated

**User-centric, incremental decomposition.** Before any code, the skill walks through four levels — **User Stories → Data Model → User Workflows → Interfaces** — each requiring explicit user approval before moving to the next. The `<HARD-GATE>` marker tells the AI it cannot combine, skip, or preview levels.

Unlike `design-first-collaboration` (which focuses on system architecture), this skill is **feature-focused**: it starts with what users need, grounds data decisions in those stories, validates workflows, and only then locks down interfaces.

## How this differs from design-first-collaboration

| Aspect | design-first-collaboration | feature-design |
|--------|--------------------------|-----------------|
| **Scope** | System-wide architecture | Single feature |
| **Level 1** | Capabilities (what system does) | User Stories (what users need) |
| **Level 2** | Components (what pieces exist) | Data Model (what data structures) |
| **Level 3** | Interactions (how pieces talk) | Workflows (how users interact) |
| **Level 4** | Contracts (services & APIs) | Interfaces (APIs & DTOs) |
| **Best for** | New subsystems, major refactors | Individual feature work, backlog items |

## When to use each

**Use `design-first-collaboration` for:**
- New subsystems (e.g., "add a real-time notification system")
- Major architectural changes (e.g., "refactor auth to use OAuth")
- Cross-cutting concerns (e.g., "add request tracing")

**Use `feature-design` for:**
- Individual user stories (e.g., "add source submission workflow")
- Feature additions to existing systems (e.g., "add filtering to topics list")
- Data model extensions (e.g., "add topic versioning")
- Backlog items that are feature-focused

## Adapting this skill

Two ways to use this:

1. **Full four levels for complex features.** The levels apply to any non-trivial feature work — apply it to your backlog items.
2. **Trim to two or three levels for smaller work.** For a simple field addition, "Data Model + Interfaces" may be enough.

## Key principles

**Incremental approval catches issues.** "Looks fine" on a 4-page design doc is rubber-stamping; "looks fine" after one section is a real signal.

**User stories drive everything.** The data model exists to support them. Workflows prove the model works. Interfaces implement the workflows. If a design choice doesn't connect back to a user story, question it.

**Workflows are where you find problems.** Before coding, walk through: "How does a user do X?" If the data model doesn't support it, you'll find out here, not in code review.
