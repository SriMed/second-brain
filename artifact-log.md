# Artifact Log

This log records generated or research-derived artifacts for the Second Brain workspace.

## 2026-06-02: Research Takeaways For Recall Game MVP

Artifact type: research summary

Purpose: inform the first React MVP for a quiet study tool / quick game session hybrid.

Sources consulted:

- Quizlet study modes: https://quizlet.com/ca/features/studymodes
- Anki manual background: https://docs.ankiweb.net/background.html
- Vite guide: https://vite.dev/guide/

Takeaways:

- Quizlet's useful pattern is mode-based study, such as flashcards, learn, test, and match. This suggests future mode support, but not all modes belong in the first MVP.
- Anki's useful pattern is the active-recall loop followed by a learner rating that can drive future spaced repetition.
- The product notes already point to the best MVP: short cloze prompts, answer reveal, "why this matters," confidence marking, and interleaving.
- Vite with React and TypeScript is a reasonable scaffold for a lightweight local app.

Decision:

- Build the first version as a quiet focused recall session with a small amount of game energy: progress, streak/session feedback, and clear next-card actions.
- Defer full study modes, account features, synced progress, semantic answer checking, and deck management.

No image mockups were generated for this artifact.

## 2026-06-02: MVP Browser Screenshot

Artifact type: browser verification screenshot

Purpose: visually inspect the first React MVP after implementation.

Result:

- Captured the running app at `http://127.0.0.1:5173/`.
- Verified the interface shows a focused recall session with progress, card metadata, typed-answer input, reveal action, and session feedback.
- Saved screenshot: `artifacts/second-brain-mvp-browser.png`.

## 2026-06-02: Research Takeaways For Better Recall Formats

Artifact type: research summary

Purpose: evaluate whether cloze cards are the right default for SDE maturation, and identify stronger alternatives for context-rich engineering judgment cards.

Sources consulted:

- Retrieval practice review: https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00005/full
- Dunlosky et al. learning techniques review: https://journals.sagepub.com/stoken/rbtfl/Z10jaVH/60XQM/full
- Teaching the science of learning: https://link.springer.com/article/10.1186/s41235-017-0087-y
- Self-explanation vs. elaborative interrogation abstract: https://pubmed.ncbi.nlm.nih.gov/9769186/
- Task differences in retrieval practice: https://link.springer.com/article/10.1007/s11251-020-09526-1

Takeaways:

- Retrieval practice can use free recall, cued recall, or recognition. Cloze is only one kind of cued recall, not the whole design space.
- Free recall and cued recall generally ask for more recollection than simple recognition, but multiple-choice can still be useful when wrong answers expose a meaningful distinction.
- Targeted short-answer prompts help retention of specific targeted information. Holistic free-recall prompts can support broader context, interest, and confidence.
- Self-explanation is promising for transfer because the learner explains why a decision, process, or rule works and how it connects to prior knowledge.
- Elaborative interrogation uses "why" and "how" prompts, but generated explanations must be checked against source material because poor explanations can reinforce wrong ideas.

Product implications:

- Keep cloze as one card type, not the default for every card.
- Add context before the prompt: situation, decision, and consequence.
- Prefer engineering-judgment prompts for product-specific lessons: "What principle was at stake?", "What failure mode was avoided?", "What would you check first?"
- Use exact-name recall only for operational facts where the name itself matters, such as Kubernetes commands, CLI flags, API names, or production runbook steps.
- Treat product-specific implementation details like Langflow field names as optional evidence, not the main answer, unless the user's goal is to memorize that system.

Decision:

- Revise the MVP toward context-rich scenario cards and multiple recall modes: explain, choose, apply, trace, and exact command/name.
- Keep the UI quiet and session-based, but demote card IDs from tag-like visual treatment into plain metadata.
