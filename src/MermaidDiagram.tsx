import { useEffect, useState } from "react";

export type CardDiagram = {
  caption: string;
  source: string;
};

let renderNumber = 0;
let renderer: Promise<typeof import("mermaid")["default"]> | undefined;

function loadRenderer() {
  renderer ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      flowchart: { htmlLabels: false },
      suppressErrorRendering: true,
    });
    return mermaid;
  });
  return renderer;
}

function DiagramCanvas({ caption, source }: CardDiagram) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = `card-diagram-${renderNumber++}`;
    setSvg("");
    setFailed(false);

    async function draw() {
      try {
        const mermaid = await loadRenderer();
        if (cancelled) return;
        const result = await mermaid.render(id, source);
        if (!cancelled) setSvg(result.svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void draw();
    return () => {
      // A closed panel or a different card must not receive a late render result.
      cancelled = true;
    };
  }, [source]);

  return (
    <figure className="card-diagram">
      {failed ? (
        <p role="alert">Could not render this diagram. Check its Mermaid syntax below.</p>
      ) : svg ? (
        // Only Mermaid's strict-mode sanitized SVG enters this HTML boundary.
        <div
          className="card-diagram-image"
          role="img"
          aria-label={caption}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p role="status">Drawing diagram…</p>
      )}
      <figcaption>{caption}</figcaption>
      <details className="card-diagram-source">
        <summary>Show diagram source</summary>
        <pre>{source}</pre>
      </details>
    </figure>
  );
}

export default function MermaidDiagram({ diagram }: { diagram: CardDiagram }) {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="collapsible card-diagram-panel"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>See diagram</summary>
      {open && <DiagramCanvas {...diagram} />}
    </details>
  );
}
