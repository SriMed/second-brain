import { FormEvent, useMemo, useState, type ReactNode } from "react";
import deck from "../cards.json";

type ReviewPhase = "reflecting" | "revealed";

type Tradeoff = {
  option: string;
  pros: string[];
  cons: string[];
};

type Card = {
  id: string;
  title: string;
  concept: string;
  jiraTicket: string;
  projectGoal: string;
  situation: string;
  featureGoalOrBugFix: string;
  constraints: string[];
  tradeoffs: Tradeoff[];
  reflectionPrompts: string[];
  gentleCorrection: string;
  seniorLens: string;
  performanceReviewFrame: string;
  tags: string[];
};

type CardDeck = {
  schemaVersion: string;
  cards: Card[];
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

const typedDeck = deck as CardDeck;
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
  return [...cards].sort((firstCard, secondCard) => {
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

function App() {
  const [initialProgress] = useState<StoredProgress>(() => loadStoredProgress());
  const [progress, setProgress] = useState<StoredProgress>(initialProgress);
  const [sessionCardIds] = useState(() =>
    orderCardsForSession(typedDeck.cards, initialProgress).map((card) => card.id),
  );
  const cardById = useMemo(() => new Map(typedDeck.cards.map((card) => [card.id, card])), []);
  const sessionCards = useMemo(
    () => sessionCardIds.map((cardId) => cardById.get(cardId)).filter((card): card is Card => Boolean(card)),
    [cardById, sessionCardIds],
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [storyStepIndex, setStoryStepIndex] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>("reflecting");
  const [reflection, setReflection] = useState("");
  const [animationKey, setAnimationKey] = useState(0);

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
          <p>{currentCard.situation}</p>
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
            <p>{currentCard.featureGoalOrBugFix}</p>
          </section>
          <section>
            <p className="section-label">Broader project goal</p>
            <p>{currentCard.projectGoal}</p>
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
              <li key={constraint}>{constraint}</li>
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
                <h3>{tradeoff.option}</h3>
                <p>
                  <strong>Pros:</strong> {tradeoff.pros.join("; ")}
                </p>
                <p>
                  <strong>Cons:</strong> {tradeoff.cons.join("; ")}
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
              <p key={prompt}>{prompt}</p>
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

  function markReviewed() {
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
          <div className="daily-marker" aria-label="Today">
            <span>{getTodayLabel()}</span>
            <small>5 min</small>
          </div>
        </header>

        <div className="session-meta" aria-label="Current card metadata">
          <span>{currentCard.id}</span>
          <span>{currentCard.jiraTicket}</span>
          <span>{currentCard.concept}</span>
          <span>{reviewCount} reviews</span>
        </div>

        <article className="reflection-card">
          <div className="companion-badge" aria-live="polite">
            <span className="companion-face" aria-hidden="true">
              {phase === "revealed" ? "🌟" : currentStoryStep.emoji}
            </span>
            <span>{phase === "revealed" ? "Turn it into your story." : currentStoryStep.companion}</span>
            <span className="sparkle-burst" key={animationKey} aria-hidden="true">
              ✨
            </span>
          </div>

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
              <div className="story-step" key={step.id} style={{ animationDelay: `${index * 50}ms` }}>
                {step.content}
              </div>
            ))}
          </div>

          {!isStoryComplete ? (
            <div className="story-control">
              <button className="primary-action story-action" type="button" onClick={revealNextStoryStep}>
                Continue story
              </button>
            </div>
          ) : null}

          {phase === "revealed" ? (
            <section className="lens-panel" aria-live="polite">
              <div>
                <p className="section-label">Senior lens</p>
                <p>{currentCard.seniorLens}</p>
              </div>
              <div>
                <p className="section-label">Gentle correction</p>
                <p>{currentCard.gentleCorrection}</p>
              </div>
              <div>
                <p className="section-label">Review framing</p>
                <p>{currentCard.performanceReviewFrame}</p>
              </div>
              <button className="success-action" type="button" onClick={markReviewed}>
                Mark reviewed
              </button>
            </section>
          ) : null}
        </article>

        <footer className="session-footer">
          <span>
            Card {currentCardIndex + 1} / {sessionCards.length}
          </span>
          <span>{lastReviewedAt ? `Last reviewed ${new Date(lastReviewedAt).toLocaleDateString()}` : "Not reviewed yet"}</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
