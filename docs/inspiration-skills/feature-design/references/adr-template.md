# Feature ADR Template

Use this format when generating ADRs from the feature-design skill.

```markdown
# ADR-{NNN}: {Feature Name}

## Status

Proposed

## Context

{From Level 1 User Stories — what the user needs and why. Include a "User Stories:" bulleted list.}

**User Stories:**
- As a [user], I want to [action], so that [benefit]
- As a [user], I want to [action], so that [benefit]

## Data Model

{From Level 2 — new or modified entities, attributes, and relationships. Show how the model supports the user stories.}

**New/Modified Entities:**
- {Entity name}: {description}
- {Entity name}: {description}

**Key Relationships:**
- {Relationship description}
- {Relationship description}

## User Workflows

{From Level 3 — happy path and variations. Show how users interact with the feature.}

### Happy Path

1. User [action]
2. System [response]
3. {Continue...}

### Variation: [Scenario]

1. User [action]
2. System [response]
3. {Continue...}

## Interfaces & Contracts

{From Level 4 — APIs, Server Actions, DTOs. Show the exact shapes of request/response.}

### API Endpoints / Server Actions

```typescript
// Example Server Action
export async function submitSource(input: SubmitSourceInput): Promise<SourceResponse>

interface SubmitSourceInput {
  topicId: number
  title: string
  sourceType: string
  content: string
}

interface SourceResponse {
  id: number
  topicId: number
  title: string
  createdAt: Date
}
```

### Component Interfaces

```typescript
// Example component prop interface
interface SourceFormProps {
  topicId: number
  onSuccess?: (source: SourceResponse) => void
}
```

## Key Decisions

{Extract 3-5 key decisions from across all levels. Each decision follows this structure:}

### 1. {Decision title}

**Decision:** {What we chose}

**Alternatives considered:**
- {Alternative A}
- {Alternative B}

**Why:** {Rationale for this choice}

**Trade-off:** {What we give up and how we mitigate}

### 2. {Next decision...}

{Continue for each key decision}

## Appendix: Design Levels

<details>
<summary>Full design conversation (click to expand)</summary>

### Level 1: User Stories & Requirements
{As presented and approved}

### Level 2: Data Model
{As presented and approved}

### Level 3: User Workflows
{As presented and approved}

### Level 4: Interfaces & Contracts
{As presented and approved}

</details>
```

## Notes

- **Status** starts as "Proposed" — updated to "Implemented (PR #NNN)" after the feature ships
- **Data Model** should reference your actual Drizzle table names and schema patterns
- **User Workflows** are essential — they're where you validate the data model and find issues before coding
- **Interfaces & Contracts** use TypeScript syntax but don't include implementation (function bodies)
- **Key Decisions** focus on the "why" — alternatives and trade-offs are what make ADRs valuable
- **Appendix** preserves the full design conversation for context, but behind a collapsible section
