---
name: generate-second-brain-card
description: Create or update focused Second Brain situation cards for developer growth. Use when the user wants to turn one or more interesting work moments, Jira tickets, bug fixes, feature decisions, code review lessons, debugging sessions, architecture tradeoffs, or daily/weekly reflections into structured `second-brain.cards.v2` cards with situation context, project goal, tradeoffs, reflection prompts, senior lens, gentle correction, performance-review framing, and tags.
---

# Generate Second Brain Card

## Outcome

Help the user turn real engineering moments into focused, durable Second Brain cards. Each card should capture the smallest independently useful lesson: concrete enough to support performance review, interview, mentoring, or weekly review stories, and abstract enough to teach reusable developer judgment rather than memorizing project trivia.

## Card Destination

Use this default destination unless the user provides a different path:

```text
DEFAULT_CARDS_JSON_PATH=${SECOND_BRAIN_CARDS_PATH}
```

If `SECOND_BRAIN_CARDS_PATH` is not set, ask the user for the path to their `cards.json` before proceeding. If the user gives another path for a turn, use that instead.

## Workflow

1. Start with this question:

   "What did you find interesting, and what feels useful to remember?"

2. If the answer is vague, use at most three follow-up prompts at a time:

   - What was the Jira ticket or work item?
   - What changed for the user, system, team, or project?
   - What felt confusing, risky, surprising, or cool?
   - What decision or tradeoff did you notice?
   - What would you want future-you to recognize faster?
   - How did this connect to the broader project goal?

3. Identify the distinct durable concepts in the user's content. Prefer specific growth concepts over generic labels:

   - Good: "React state ownership", "Terraform replacement-risk review", "Python parsing boundaries", "API contract versioning", "test isolation", "adapter boundary design"
   - Too broad: "React", "best practices", "debugging", "communication"

4. Decide how to organize the content before drafting:

   - Create the smallest independently useful card.
   - Split the content when each resulting card teaches a distinct reusable judgment and can stand on its own without duplicating most of another card's context.
   - Keep context, decision, tradeoffs, and outcome together when separating them would weaken the lesson.
   - Do not assume one ticket, meeting, reflection, or large input should become one card.
   - Do not create extra cards merely because the input is long.

   If more than one card is warranted, propose the card set with a one-sentence focus for each card and explain the boundaries between them. Let the user adjust the organization before drafting.

5. Draft each card in prose first. Make sure each story can be explained independently to a junior developer, a performance-review audience, or an interviewer.

6. Produce valid JSON for each proposed `second-brain.cards.v2` card using this shape:

```json
{
  "id": "SB-CONCEPT-001",
  "title": "A concrete engineering story title",
  "concept": "Specific durable concept",
  "jiraTicket": "PROJECT-123",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "archived": false,
  "projectGoal": "Broader project outcome this work supported.",
  "situation": "What happened, with enough concrete detail to remember the story. Include numbers, approximate sizes, and specifics that anchor the memory without exposing internal IP.",
  "situationCollapsible": "Optional. 2–4 sentences of raw context: what screen, what the exact failure was, what prompted the learning moment, or a link to a relevant resource. Omit if nothing useful to add.",
  "featureGoalOrBugFix": "The immediate feature goal or bug fix.",
  "constraints": [
    "Constraint with a number or specific detail where possible.",
    "Constraint that shaped the risk.",
    "Constraint that shaped implementation."
  ],
  "tradeoffs": [
    {
      "option": "One plausible path",
      "pros": ["Useful upside with specifics"],
      "cons": ["Meaningful downside with specifics"]
    },
    {
      "option": "Another plausible path",
      "pros": ["Useful upside with specifics"],
      "cons": ["Meaningful downside with specifics"]
    }
  ],
  "reflectionPrompts": [
    "Prompt that makes the user reason from the situation.",
    "Prompt that checks the transferable principle.",
    "Prompt that asks for evidence or a next check."
  ],
  "gentleCorrection": "A concise nudge for the most likely incomplete or off-track reasoning.",
  "seniorLens": "The principle a senior engineer would use to reason through the situation.",
  "performanceReviewFrame": "A truthful impact-oriented sentence the user could adapt later.",
  "tags": ["specific", "searchable", "growth-area"]
}
```

Notes on new fields:
- `createdAt`: always set to current ISO timestamp when creating a card.
- `archived`: default `false`. Set `true` to hide a card from the app without deleting it.
- `situationCollapsible`: optional string. Use it when the situation needs extra grounding context (raw specifics, how the card was created, a URL) but that detail would make the main `situation` field too long or too project-specific.

7. Ask for approval before editing `cards.json`. If the user approves, append all approved cards to `DEFAULT_CARDS_JSON_PATH` unless the user provided a different destination. Preserve the existing `schemaVersion` and valid JSON formatting.

8. After editing, validate with a JSON parse command and summarize what changed.

## Optional Diagrams

Include a Mermaid diagram when it materially clarifies relationships, boundaries, or flow. Omit it when prose is clearer. Keep it focused on the card’s reusable lesson.

Use the optional `diagram` object with `caption` and `source`, both strings. Write a short explanatory caption and raw Mermaid syntax in `source`, without Markdown fences. Escape newlines as `\n` in JSON. The app displays this diagram in a collapsible panel on the Situation step.

```json
"diagram": {
  "caption": "Application code is packaged before it runs.",
  "source": "flowchart LR\n  Code[Application code] --> Image[Container image] --> Pod[Running pod]"
}
```

## Card Quality Rules

- Make the card about judgment, not trivia.
- Keep each card centered on one reusable judgment. If the title or concept needs "and" to join independent lessons, consider splitting it.
- Prefer multiple focused cards over one catch-all card when the source contains independently useful decisions, lessons, or situations.
- Avoid over-splitting: shared context alone does not require a separate card, and closely coupled parts of one decision should stay together.
- Avoid duplicate cards. Each card in a set must offer a meaningfully different retrieval target and reflection opportunity.
- Keep Jira details as anchors, not the thing being memorized.
- Tie the card to the broader project goal whenever possible.
- Include two real options in `tradeoffs`; do not invent fake choices just to fill the field.
- Make `gentleCorrection` kind, specific, and short.
- Make `performanceReviewFrame` truthful. Do not inflate impact beyond what the user described.
- Prefer tags that the user could search later, such as language, framework, domain, and growth theme.
- **Be specific and use numbers where possible.** Vague language like "slightly larger refactor" or "some overhead" is not useful. Prefer "~40 extra lines", "2–4 hours of extra config", "3 service calls reduced to 1". Estimate when exact numbers aren't known.
- **Situation fields should read like a log entry, not a textbook paragraph.** Ground the situation in what actually happened: what screen, what broke, what the team was debating, what surprised you. Abstract enough to teach, specific enough to remember.
- **Do not over-smooth.** Sanitize internal project names and IP, but keep concrete details that anchor the memory: approximate size of change, number of services involved, the exact thing that was confusing.
- **Add a `contextCollapsible` field** on any step where extra background would help recall without cluttering the main card body. This is a foldable section shown in the UI. Use it for: raw situation specifics, how the card was created, what prompted the learning moment, links to relevant resources. Keep it to 2–4 sentences.

## ID Guidance

Use `SB-<AREA>-<NUMBER>`, such as `SB-REACT-002`, `SB-TF-003`, or `SB-PY-004`. Inspect existing `cards.json` before choosing the next number. If no obvious area exists, use a short durable concept slug like `SB-API-001` or `SB-DEBUG-001`.

## Editing Guidance

When editing `cards.json`:

- Preserve all existing cards.
- Keep the root shape as `{ "schemaVersion": "second-brain.cards.v2", "cards": [...] }`.
- Use structured JSON editing or careful patching. Do not leave trailing commas.
- Do not rewrite unrelated cards.
