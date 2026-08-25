import { FormEvent, useMemo, useState, type ReactNode } from "react";
import deck from "../cards.json";

type ReviewPhase = "reflecting" | "revealed";

type Tradeoff = {
  option: string;
  pros: string[];
  cons: string[];
};

type RelatedCard = {
  id: string;
  reason: string;
};

type Card = {
  id: string;
  title: string;
  concept: string;
  jiraTicket: string | null;
  createdAt?: string;
  archived?: boolean;
  projectGoal: string;
  situation: string;
  situationCollapsible?: string;
  featureGoalOrBugFix: string;
  constraints: string[];
  tradeoffs: Tradeoff[];
  reflectionPrompts: string[];
  gentleCorrection: string;
  seniorLens: string;
  performanceReviewFrame: string;
  tags: string[];
  relatedCards?: RelatedCard[];
};

type CardDeck = {
  schemaVersion: string;
  cards: Card[];
};

type VocabEntry = {
  id: string;
  term: string;
  blurb: string;
  context?: string;
  tags: string[];
};

type VocabDeck = {
  schemaVersion: string;
  entries: VocabEntry[];
};

type StoredProgress = {
  reviewsByCardId: Record<string, number>;
  lastReviewedAtByCardId: Record<string, string>;
};

type StoryStep = {
  id: string;
  label: string;
  emoji: string;
  companion: string;
  content: ReactNode;
};

type AppView = "review" | "vocab";

const typedDeck = deck as CardDeck;

// vocab.json is optional and gitignored (personal content, same as cards.json) — use an
// eager glob rather than a static import so a missing file degrades to an empty deck
// instead of a hard build failure.
const vocabModules = import.meta.glob<{ default: VocabDeck }>("../vocab.json", { eager: true });
const typedVocabDeck: VocabDeck = Object.values(vocabModules)[0]?.default ?? {
  schemaVersion: "1",
  entries: [],
};

const progressStorageKey = "second-brain.situation-progress.v1";

function createEmptyProgress(): StoredProgress {
  return {
    reviewsByCardId: {},
    lastReviewedAtByCardId: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "number");
}

function parseStoredProgress(value: unknown): StoredProgress {
  if (!isRecord(value)) {
    return createEmptyProgress();
  }

  return {
    reviewsByCardId: isNumberRecord(value.reviewsByCardId) ? value.reviewsByCardId : {},
    lastReviewedAtByCardId: isStringRecord(value.lastReviewedAtByCardId)
      ? value.lastReviewedAtByCardId
      : {},
  };
}

function loadStoredProgress(): StoredProgress {
  try {
    const storedProgress = localStorage.getItem(progressStorageKey);

    if (!storedProgress) {
      return createEmptyProgress();
    }

    return parseStoredProgress(JSON.parse(storedProgress));
  } catch {
    return createEmptyProgress();
  }
}

function saveStoredProgress(progress: StoredProgress) {
  localStorage.setItem(progressStorageKey, JSON.stringify(progress));
}

function orderCardsForSession(cards: Card[], progress: StoredProgress) {
  return [...cards]
    .filter((card) => !card.archived)
    .sort((firstCard, secondCard) => {
      const firstReviews = progress.reviewsByCardId[firstCard.id] ?? 0;
      const secondReviews = progress.reviewsByCardId[secondCard.id] ?? 0;

      if (firstReviews !== secondReviews) {
        return firstReviews - secondReviews;
      }

      const firstReviewedAt = progress.lastReviewedAtByCardId[firstCard.id] ?? "";
      const secondReviewedAt = progress.lastReviewedAtByCardId[secondCard.id] ?? "";

      return firstReviewedAt.localeCompare(secondReviewedAt);
    });
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Vocab terms are matched whole-word, case-insensitively, longest term first so a
// multi-word term (e.g. "vector database") isn't shadowed by a shorter one it contains
// (e.g. "vector") that also happens to be in the deck.
function buildVocabPattern(entries: VocabEntry[]): RegExp | null {
  if (entries.length === 0) {
    return null;
  }

  const alternation = [...entries]
    .sort((a, b) => b.term.length - a.term.length)
    .map((entry) => escapeForRegExp(entry.term))
    .join("|");

  return new RegExp(`\\b(${alternation})\\b`, "gi");
}

function VocabTerm({ entry, onOpen }: { entry: VocabEntry; onOpen: (entry: VocabEntry) => void }) {
  const [peeking, setPeeking] = useState(false);

  return (
    <span
      className="vocab-term-wrap"
      onMouseEnter={() => setPeeking(true)}
      onMouseLeave={() => setPeeking(false)}
    >
      <button
        type="button"
        className="vocab-term"
        onClick={() => onOpen(entry)}
        onFocus={() => setPeeking(true)}
        onBlur={() => setPeeking(false)}
      >
        {entry.term}
      </button>
      {peeking && (
        <span className="vocab-peek" role="tooltip">
          <strong>{entry.term}</strong>
          <span>{entry.blurb}</span>
        </span>
      )}
    </span>
  );
}

function Collapsible({ content }: { content: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="collapsible">
      <button
        className="collapsible-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="collapsible-icon">{open ? "▾" : "▸"}</span>
        More context
      </button>
      {open && <p className="collapsible-body">{content}</p>}
    </div>
  );
}

function StepShell({
  emoji,
  companion,
  children,
  animationDelay,
}: {
  emoji: string;
  companion: string;
  children: ReactNode;
  animationDelay: number;
}) {
  return (
    <div className="story-step" style={{ animationDelay: `${animationDelay}ms` }}>
      <div className="step-companion">
        <span className="step-companion-face" aria-hidden="true">{emoji}</span>
        <span className="step-companion-label">{companion}</span>
      </div>
      {children}
    </div>
  );
}

function VocabPage({
  entries,
  focusedEntryId,
  onBack,
}: {
  entries: VocabEntry[];
  focusedEntryId: string | null;
  onBack: () => void;
}) {
  const allTags = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.tags))].sort(),
    [entries],
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const visibleEntries = activeTag
    ? entries.filter((entry) => entry.tags.includes(activeTag))
    : entries;

  return (
    <main className="app-shell">
      <section className="daily-panel" aria-label="Vocab">
        <header className="session-header">
          <div>
            <p className="eyebrow">Second Brain</p>
            <h1>Vocab</h1>
          </div>
          <button className="skip-action" type="button" onClick={onBack}>
            ← Back to cards
          </button>
        </header>

        {allTags.length > 0 && (
          <div className="vocab-tag-filter" aria-label="Filter by tag">
            <button
              className={activeTag === null ? "vocab-tag vocab-tag-active" : "vocab-tag"}
              type="button"
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={activeTag === tag ? "vocab-tag vocab-tag-active" : "vocab-tag"}
                type="button"
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {visibleEntries.length === 0 ? (
          <article className="reflection-card">
            <p className="section-label">No vocab words yet</p>
            <p>
              Add entries to <code>vocab.json</code> in the project root — same gitignored,
              local-only treatment as <code>cards.json</code>. Each entry needs an{" "}
              <code>id</code>, <code>term</code>, <code>blurb</code>, and open-form{" "}
              <code>tags</code>.
            </p>
          </article>
        ) : (
          <div className="vocab-list">
            {visibleEntries.map((entry) => (
              <article
                key={entry.id}
                className={
                  entry.id === focusedEntryId ? "vocab-entry vocab-entry-focused" : "vocab-entry"
                }
              >
                <h3>{entry.term}</h3>
                <p>{entry.blurb}</p>
                {entry.context && <p className="vocab-entry-context">{entry.context}</p>}
                {entry.tags.length > 0 && (
                  <div className="tag-row">
                    {entry.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function App() {
  const [initialProgress] = useState<StoredProgress>(() => loadStoredProgress());
  const [progress, setProgress] = useState<StoredProgress>(initialProgress);
  const [sessionCardIds] = useState(() =>
    orderCardsForSession(typedDeck.cards, initialProgress).map((card) => card.id),
  );
  const cardById = useMemo(() => new Map(typedDeck.cards.map((card) => [card.id, card])), []);
  const sessionCards = useMemo(
    () =>
      sessionCardIds
        .map((cardId) => cardById.get(cardId))
        .filter((card): card is Card => Boolean(card)),
    [cardById, sessionCardIds],
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [storyStepIndex, setStoryStepIndex] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>("reflecting");
  const [reflection, setReflection] = useState("");
  const [animationKey, setAnimationKey] = useState(0);

  // Vocab is a reference layer, not part of the review deck: it never enters
  // orderCardsForSession or the reviewsByCardId scheduling above.
  const [view, setView] = useState<AppView>("review");
  const [focusedVocabId, setFocusedVocabId] = useState<string | null>(null);
  const vocabEntries = typedVocabDeck.entries;
  const vocabPattern = useMemo(() => buildVocabPattern(vocabEntries), [vocabEntries]);
  const vocabByTerm = useMemo(
    () => new Map(vocabEntries.map((entry) => [entry.term.toLowerCase(), entry])),
    [vocabEntries],
  );

  const openVocabEntry = (entry: VocabEntry) => {
    setFocusedVocabId(entry.id);
    setView("vocab");
  };

  // Wraps any vocab term found in `text` with a hoverable, clickable VocabTerm link;
  // everything else passes through untouched.
  function withVocabLinks(text: string): ReactNode {
    if (!vocabPattern || !text) {
      return text;
    }

    const parts = text.split(vocabPattern);
    if (parts.length === 1) {
      return text;
    }

    return parts.map((part, index) => {
      const entry = vocabByTerm.get(part.toLowerCase());
      // Plain strings don't need React keys; only the VocabTerm elements do.
      return entry ? <VocabTerm key={`${entry.id}-${index}`} entry={entry} onOpen={openVocabEntry} /> : part;
    });
  }

  if (view === "vocab") {
    return (
      <VocabPage
        entries={vocabEntries}
        focusedEntryId={focusedVocabId}
        onBack={() => setView("review")}
      />
    );
  }

  if (sessionCards.length === 0) {
    return (
      <main className="app-shell">
        <section className="daily-panel" aria-label="Second Brain daily card">
          <p className="eyebrow">Second Brain</p>
          <h1>No cards yet</h1>
        </section>
      </main>
    );
  }

  const currentCard = sessionCards[currentCardIndex % sessionCards.length];
  const reviewCount = progress.reviewsByCardId[currentCard.id] ?? 0;
  const lastReviewedAt = progress.lastReviewedAtByCardId[currentCard.id];

  const storySteps: StoryStep[] = [
    {
      id: "situation",
      label: "Situation",
      emoji: "🐣",
      companion: "Start with what changed.",
      content: (
        <section className="story-section" aria-labelledby="situation-heading">
          <p className="section-label" id="situation-heading">
            Situation
          </p>
          <p>{withVocabLinks(currentCard.situation)}</p>
          {currentCard.situationCollapsible && (
            <Collapsible content={withVocabLinks(currentCard.situationCollapsible)} />
          )}
        </section>
      ),
    },
    {
      id: "goals",
      label: "Goals",
      emoji: "🦊",
      companion: "Now connect the work to the bigger why.",
      content: (
        <div className="context-grid">
          <section>
            <p className="section-label">Feature or bug goal</p>
            <p>{withVocabLinks(currentCard.featureGoalOrBugFix)}</p>
          </section>
          <section>
            <p className="section-label">Broader project goal</p>
            <p>{withVocabLinks(currentCard.projectGoal)}</p>
          </section>
        </div>
      ),
    },
    {
      id: "constraints",
      label: "Constraints",
      emoji: "🐰",
      companion: "Name the boundaries before choosing a path.",
      content: (
        <section className="story-section">
          <p className="section-label">Constraints</p>
          <ul>
            {currentCard.constraints.map((constraint) => (
              <li key={constraint}>{withVocabLinks(constraint)}</li>
            ))}
          </ul>
        </section>
      ),
    },
    {
      id: "tradeoffs",
      label: "Tradeoffs",
      emoji: "🦉",
      companion: "This is where judgment starts to show.",
      content: (
        <section className="story-section">
          <p className="section-label">Tradeoffs</p>
          <div className="tradeoff-list">
            {currentCard.tradeoffs.map((tradeoff) => (
              <div className="tradeoff-option" key={tradeoff.option}>
                <h3>{withVocabLinks(tradeoff.option)}</h3>
                <p>
                  <strong>Pros:</strong> {withVocabLinks(tradeoff.pros.join("; "))}
                </p>
                <p>
                  <strong>Cons:</strong> {withVocabLinks(tradeoff.cons.join("; "))}
                </p>
              </div>
            ))}
          </div>
        </section>
      ),
    },
    {
      id: "reflection",
      label: "Reasoning",
      emoji: "✨",
      companion: "Your turn: talk through the senior shape of it.",
      content: (
        <form className="reflection-form" onSubmit={revealSeniorLens}>
          <label htmlFor="reflection">Your reasoning</label>
          <textarea
            id="reflection"
            name="reflection"
            onChange={(event) => setReflection(event.target.value)}
            placeholder="Talk through the principle, risk, and next check."
            rows={5}
            value={reflection}
          />

          <div className="prompt-list" aria-label="Reflection prompts">
            {currentCard.reflectionPrompts.map((prompt) => (
              <p key={prompt}>{withVocabLinks(prompt)}</p>
            ))}
          </div>

          <button className="primary-action" type="submit">
            Reveal lens
          </button>
        </form>
      ),
    },
  ];

  const visibleStorySteps = storySteps.slice(0, storyStepIndex + 1);
  const currentStoryStep = storySteps[storyStepIndex];
  const isStoryComplete = storyStepIndex === storySteps.length - 1;

  function revealSeniorLens(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("revealed");
    setAnimationKey((key) => key + 1);
  }

  function revealNextStoryStep() {
    setStoryStepIndex((index) => Math.min(index + 1, storySteps.length - 1));
    setAnimationKey((key) => key + 1);
  }

  function advanceCard(markAsReviewed: boolean) {
    if (markAsReviewed) {
      const updatedProgress: StoredProgress = {
        reviewsByCardId: {
          ...progress.reviewsByCardId,
          [currentCard.id]: reviewCount + 1,
        },
        lastReviewedAtByCardId: {
          ...progress.lastReviewedAtByCardId,
          [currentCard.id]: new Date().toISOString(),
        },
      };
      setProgress(updatedProgress);
      saveStoredProgress(updatedProgress);
    }

    setCurrentCardIndex((index) => (index + 1) % sessionCards.length);
    setStoryStepIndex(0);
    setReflection("");
    setPhase("reflecting");
    setAnimationKey((key) => key + 1);
  }

  return (
    <main className="app-shell">
      <section className="daily-panel" aria-label="Second Brain daily card">
        <header className="session-header">
          <div>
            <p className="eyebrow">Second Brain</p>
            <h1>Daily card</h1>
          </div>
          <div className="header-actions">
            <button
              className="vocab-nav-link"
              type="button"
              onClick={() => {
                setFocusedVocabId(null);
                setView("vocab");
              }}
            >
              📖 Vocab
            </button>
            <div className="daily-marker" aria-label="Today">
              <span>{getTodayLabel()}</span>
            </div>
          </div>
        </header>

        <div className="session-meta" aria-label="Current card metadata">
          <span>{currentCard.id}</span>
          {currentCard.jiraTicket && <span>{currentCard.jiraTicket}</span>}
          <span>{currentCard.concept}</span>
          <span>{reviewCount} reviews</span>
        </div>

        <article className="reflection-card">
          <div className="tag-row" aria-label="Card tags">
            {currentCard.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <h2>{currentCard.title}</h2>

          <div className="story-progress" aria-label="Story progress">
            {storySteps.map((step, index) => (
              <span
                className={index <= storyStepIndex ? "story-dot story-dot-active" : "story-dot"}
                key={step.id}
                title={step.label}
              />
            ))}
          </div>

          <div className="story-stack">
            {visibleStorySteps.map((step, index) => (
              <StepShell
                key={step.id}
                emoji={step.emoji}
                companion={step.companion}
                animationDelay={index * 50}
              >
                {step.content}
              </StepShell>
            ))}
          </div>

          {!isStoryComplete ? (
            <div className="story-control">
              <button
                className="primary-action story-action"
                type="button"
                onClick={revealNextStoryStep}
              >
                Continue story
              </button>
              <button
                className="skip-action"
                type="button"
                onClick={() => advanceCard(false)}
                aria-label="Skip to next card without marking reviewed"
              >
                Skip
              </button>
            </div>
          ) : null}

          {phase === "revealed" ? (
            <section className="lens-panel" aria-live="polite">
              <div className="step-companion">
                <span className="step-companion-face" aria-hidden="true">🌟</span>
                <span className="step-companion-label">Turn it into your story.</span>
                <span className="sparkle-burst" key={animationKey} aria-hidden="true">✨</span>
              </div>
              <div>
                <p className="section-label">Senior lens</p>
                <p>{withVocabLinks(currentCard.seniorLens)}</p>
              </div>
              <div>
                <p className="section-label">Gentle correction</p>
                <p>{withVocabLinks(currentCard.gentleCorrection)}</p>
              </div>
              <div>
                <p className="section-label">Review framing</p>
                <p>{withVocabLinks(currentCard.performanceReviewFrame)}</p>
              </div>
              {currentCard.relatedCards && currentCard.relatedCards.length > 0 && (
                <div className="related-cards-section">
                  <p className="section-label">Related cards</p>
                  <div className="related-cards-list">
                    {currentCard.relatedCards.map((related) => {
                      const relatedCard = cardById.get(related.id);
                      return (
                        <button
                          className="related-card-chip"
                          key={related.id}
                          type="button"
                          onClick={() => {
                            const targetIndex = sessionCards.findIndex((c) => c.id === related.id);
                            if (targetIndex !== -1) {
                              setCurrentCardIndex(targetIndex);
                              setStoryStepIndex(0);
                              setReflection("");
                              setPhase("reflecting");
                              setAnimationKey((k) => k + 1);
                            }
                          }}
                        >
                          <span className="related-card-id">{related.id}</span>
                          {relatedCard && (
                            <span className="related-card-title">{relatedCard.title}</span>
                          )}
                          <span className="related-card-reason">{related.reason}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="lens-actions">
                <button className="success-action" type="button" onClick={() => advanceCard(true)}>
                  Mark reviewed
                </button>
                <button
                  className="skip-action"
                  type="button"
                  onClick={() => advanceCard(false)}
                  aria-label="Skip to next card without marking reviewed"
                >
                  Skip
                </button>
              </div>
            </section>
          ) : null}
        </article>

        <footer className="session-footer">
          <span>
            Card {currentCardIndex + 1} / {sessionCards.length}
          </span>
          <span>
            {lastReviewedAt
              ? `Last reviewed ${new Date(lastReviewedAt).toLocaleDateString()}`
              : "Not reviewed yet"}
          </span>
        </footer>
      </section>
    </main>
  );
}

export default App;
