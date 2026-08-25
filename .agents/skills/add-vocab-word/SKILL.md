---
name: add-vocab-word
description: Add vocabulary words to the Second Brain glossary (vocab.json). Use when the user says "add X as a vocab word", "define X for vocab", "new vocab entry", wants to add a term they just learned, asks to save a definition, or mentions adding to the glossary. Also use when the user wants to add multiple vocab terms at once from a discussion, README, or list of unfamiliar words.
---

# Add Vocab Word

## Outcome

Help the user quickly add well-formed vocab entries to their Second Brain glossary. Each entry captures a term, a concise definition (blurb), optional context about where/why it came up, and inferred tags. The skill confirms everything with the user before writing — no surprise edits.

## Vocab Destination

The vocab file lives at:

```text
DEFAULT_VOCAB_JSON_PATH=/Users/srilakshmi.medarametla/Documents/code/second-brain/vocab.json
```

If the file doesn't exist yet, create it with this initial structure:

```json
{
  "schemaVersion": "1",
  "entries": []
}
```

## Workflow

1. **Extract terms from the user's request.** The user might say:
   - "Add rollback as a vocab word" → single term
   - "Add these terms: monorepo, tree-shaking, hydration" → multiple terms
   - "Add the terms from that discussion" → infer from conversation context

2. **For each term, gather or infer:**
   - `term`: The word or phrase (use the canonical casing, e.g., "Tree-shaking" not "tree-shaking" unless it's genuinely all lowercase)
   - `blurb`: A concise, useful definition (1–2 sentences). Write it as if explaining to a smart developer who hasn't encountered this specific term. Be precise — avoid filler like "refers to" or "is a concept that".
   - `context`: How/where the term came up. Infer from conversation if possible (e.g., "Came up while reading the fabric project README" or "Encountered during code review on the auth service"). If you cannot infer context, ask the user.
   - `tags`: 1–3 short, searchable tags. Infer from the term's domain. Examples: `["infrastructure"]`, `["react", "performance"]`, `["networking", "security"]`. Don't over-tag.

3. **Generate the next ID.** Read the existing `vocab.json` (if it exists), find the highest numeric ID suffix (e.g., if last entry is `"VOCAB-012"`, next is `"VOCAB-013"`). If no file exists, start at `VOCAB-001`.

4. **Present the proposed entries for confirmation.** Show a clear summary like:

   ```
   Here's what I'll add to vocab.json:

   VOCAB-004 | Monorepo
      Blurb: A single repository containing multiple projects or packages, managed together with shared tooling and dependencies.
      Context: Came up while discussing the fabric project architecture.
      Tags: infrastructure, architecture

   VOCAB-005 | Tree-shaking
      Blurb: A bundler optimization that eliminates unused code by analyzing ES module imports statically at build time.
      Context: Came up while discussing the fabric project architecture.
      Tags: javascript, performance, bundling

   Add these? (or tell me what to change)
   ```

5. **Wait for explicit approval.** If the user asks for changes (different wording, different tags, skip one, etc.), revise and re-present. Do not write until the user confirms.

6. **Write to vocab.json.** Append the new entries to the `entries` array. Preserve existing entries. Keep valid JSON formatting (no trailing commas).

7. **Validate.** Run a JSON parse check after writing to confirm the file is valid.

8. **Summarize.** Brief confirmation: "Added 2 entries (v4–v5) to vocab.json."

## Entry Schema

```json
{
  "id": "VOCAB-001",
  "term": "Rollback",
  "blurb": "Reverting a system to a prior known-good state after a failed change.",
  "context": "Came up reviewing the migration card — rollback safety was the deciding constraint.",
  "tags": ["technology"]
}
```

- `id` (required): Auto-incrementing, format `VOCAB-<NNN>` (zero-padded to 3 digits)
- `term` (required): The word or phrase
- `blurb` (required): Concise definition, 1–2 sentences
- `context` (optional): Where/why this term came up
- `tags` (optional): 1–3 short searchable labels

## Quality Rules

- **Be precise.** "A deployment pattern where…" not "A thing that is used for…"
- **Be concise.** If you can say it in one sentence without losing meaning, do.
- **Don't duplicate.** Check existing entries before adding. If the term already exists, tell the user and offer to update the existing entry instead.
- **Canonical casing.** Use the standard casing for the term (e.g., "GraphQL" not "graphql", "npm" not "NPM").
- **Context should be personal.** It anchors when and why the user encountered this term, not a generic "this is commonly used in…" statement.

## Editing Guidance

When editing `vocab.json`:

- Preserve all existing entries.
- Keep the root shape as `{ "schemaVersion": "1", "entries": [...] }`.
- Do not rewrite unrelated entries.
- Validate JSON after editing.
