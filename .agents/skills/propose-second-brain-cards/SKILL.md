---
name: propose-second-brain-cards
description: Scan the current working session, chat, task context, code changes, review discussion, debugging flow, or daily/weekly reflection for interesting possible Second Brain card ideas. Use when the user asks what might be worth turning into a Second Brain card, asks for top card suggestions from the current session, wants to identify learning moments, or wants to find low-key but useful React/Python/Terraform/programming patterns to remember before optionally handing one to `generate-second-brain-card`.
---

# Propose Second Brain Cards

## Outcome

Identify up to three possible Second Brain card seeds from the available context. Optimize for what is interesting to this user, not what would impress an average developer. A small pattern, beginner/intermediate React realization, or low-key debugging lesson can be a good suggestion if it feels useful to remember.

Do not write to `cards.json` during this skill. Only propose candidates. If the user chooses one, use `$generate-second-brain-card` to turn that chosen seed into a card.

## Interestingness Rubric

Use judgment, then briefly explain it. Favor moments with one or more of these signals:

- **Personal learning value**: The user is still learning the pattern or wants future recall.
- **Transferability**: The lesson applies beyond this one ticket or project detail.
- **Review/story value**: The moment could support performance review, interview, mentoring, or weekly reflection.
- **Specificity**: There is enough concrete context to make a card useful.
- **Emotional stickiness**: The moment was confusing, surprising, satisfying, annoying, elegant, risky, or cool.

Do not require every candidate to score highly on every signal. Prefer personally useful cards over objectively impressive cards.

## Workflow

1. Review the visible/current session context. If tool access exists for thread or file state, use it only as needed and stay scoped to the user's request.

2. Look for candidate seeds:

   - A decision with tradeoffs
   - A bug or debugging turn that revealed a principle
   - A framework or language pattern the user may want to remember
   - A design/product insight
   - A moment that changed the user's understanding
   - A small but reusable implementation habit

3. Rank candidates by the interestingness rubric. If fewer than three are worthwhile, show fewer. If nothing seems worth saving, say that and explain what kind of detail would make a card possible.

4. Present suggestions in this format:

```markdown
**Top Card Ideas**

1. **Title**: ...
   **Concept**: ...
   **Likely Size**: tiny | short | medium | deep
   **Why Interesting**: ...
   **Metric Judgment**: personal learning / transferability / review value / specificity / emotional stickiness
   **What I Need**: ...

2. ...
```

5. Ask the user which candidate, if any, they want to make into a card. Do not generate the final card until the user chooses.

6. When the user chooses a candidate, use `$generate-second-brain-card` with a seed summary that includes:

   - Suggested title
   - Durable concept
   - Session evidence or context
   - Why it was interesting
   - Likely size
   - Any missing questions

## Sizing Guidance

- **tiny**: One pattern or realization; concise situation and one main tradeoff.
- **short**: A useful work moment with clear context, one or two constraints, and compact review framing.
- **medium**: A normal daily card with situation, goals, constraints, tradeoffs, and senior lens.
- **deep**: A richer incident, design decision, architecture tradeoff, or performance-review story.

Do not inflate a tiny or short card into a deep one. The user is allowed to remember small things.

## Card Quality Signals to Look For

When evaluating or describing a candidate, flag if the moment has concrete specifics worth capturing:

- Numbers or sizes: line counts, service counts, time estimates, performance deltas
- A specific screen, file, or system component that was involved
- An exact thing that was confusing, broken, or surprising
- A resource (README, PR, URL) that prompted the learning

When handing off to `generate-second-brain-card`, include these specifics in the seed summary so the final card is grounded, not generic.

## Guardrails

- Do not invent impact, Jira tickets, or project goals.
- Do not over-index on performance-review worthiness.
- Do not dismiss beginner/intermediate learning as too obvious.
- Separate session evidence from inference.
- If the current context is thin, ask one focused question instead of producing forced suggestions.
- Do not smooth over concrete details in favor of abstract language. A card that says "a form had a state bug" is less useful than "a form screen showed stale values after a parent dropdown changed selection while the form stayed mounted."
