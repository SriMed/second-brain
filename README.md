# Second Brain

A private, local-first reflection app for turning real engineering work into
short situation cards. Each card walks through the context, goals, constraints,
and tradeoffs of a decision before prompting you to explain your reasoning and
compare it with a senior-engineer lens.

The app is intentionally lightweight: there are no accounts, no backend, and no
scoring. Review progress stays in the browser.

## What it does

- Presents active cards in a guided, five-step story
- Prompts reflection before revealing the suggested senior lens
- Includes gentle corrections and performance-review framing
- Connects related cards so you can follow a concept across engineering stories
- Prioritizes cards with fewer reviews, then those reviewed least recently
- Saves review counts and timestamps in `localStorage`
- Keeps personal learning content out of version control

## Getting started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually
[`http://localhost:5173`](http://localhost:5173).

For a production build:

```bash
npm run build
npm run preview
```

## Add your cards

The app reads its deck from `cards.json` in the project root. That file is
gitignored because cards may contain personal work context, so create it
locally before running the app:

```json
{
  "schemaVersion": "second-brain.cards.v2",
  "cards": [
    {
      "id": "SB-EXAMPLE-001",
      "title": "Choosing a safe migration strategy",
      "concept": "Incremental delivery",
      "jiraTicket": null,
      "createdAt": "2026-07-25",
      "archived": false,
      "projectGoal": "Ship the change without disrupting existing users.",
      "situation": "A core workflow needs a new data model.",
      "situationCollapsible": "The old and new models must coexist during rollout.",
      "featureGoalOrBugFix": "Migrate reads and writes safely.",
      "constraints": [
        "Existing clients cannot update at the same time",
        "Rollback must remain possible"
      ],
      "tradeoffs": [
        {
          "option": "Big-bang migration",
          "pros": ["Less transitional code"],
          "cons": ["Higher release and rollback risk"]
        },
        {
          "option": "Incremental migration",
          "pros": ["Smaller blast radius", "Observable rollout"],
          "cons": ["Temporary compatibility code"]
        }
      ],
      "reflectionPrompts": [
        "What risk matters most here?",
        "What would you validate first?"
      ],
      "gentleCorrection": "Prefer a reversible path when uncertainty is high.",
      "seniorLens": "Separate the schema change from the behavior change and migrate in observable stages.",
      "performanceReviewFrame": "Reduced delivery risk by designing a reversible migration.",
      "tags": ["architecture", "delivery"],
      "relatedCards": [
        {
          "id": "SB-ARCH-002",
          "reason": "Applies the same incremental-delivery principle at a service boundary."
        }
      ]
    }
  ]
}
```

Set `"archived": true` to retain a card in the deck without including it in
review sessions. `createdAt`, `situationCollapsible`, and `relatedCards` are
optional; all other fields shown above are expected by the current UI.

Each `relatedCards` entry points to another card by ID and explains the
connection. After revealing the senior lens, the app displays these links and
lets you jump to a related active card. A link to an archived or missing card
can still be displayed, but it cannot be opened during the current session.

## Create cards with Codex

The repository includes two project skills under `.agents/skills/`:

- `propose-second-brain-cards` finds up to three useful learning moments in the
  current work session without modifying the deck.
- `generate-second-brain-card` turns a chosen work moment into a structured
  `second-brain.cards.v2` card and, after approval, adds it to the deck.

The generation skill looks for the deck path in `SECOND_BRAIN_CARDS_PATH`. Set
it to the absolute path of your private `cards.json` before asking Codex to add
a card:

```bash
export SECOND_BRAIN_CARDS_PATH="/absolute/path/to/second-brain/cards.json"
```

Example prompts:

```text
What from this session might be worth turning into a Second Brain card?
Turn this debugging lesson into a Second Brain card.
```

The skills keep proposals separate from edits and ask for approval before
writing to the deck.

## How review progress works

When you select **Mark reviewed**, the app stores the card's review count and
latest review time under `second-brain.situation-progress.v1` in browser
`localStorage`. Selecting **Skip** advances without changing progress.

Progress is tied to the current browser profile. Clearing site data, switching
browsers, or using a different device starts fresh.

## Project structure

```text
.
├── .agents/skills/     # Codex workflows for proposing and generating cards
├── cards.json          # Local card deck (gitignored)
├── src/
│   ├── App.tsx         # Review flow, card ordering, and progress persistence
│   ├── main.tsx        # React entry point
│   └── styles.css      # Application styles
├── artifact-log.md     # Product and research decision history
└── vite.config.ts      # Vite configuration
```

## Tech stack

React, TypeScript, and Vite.
