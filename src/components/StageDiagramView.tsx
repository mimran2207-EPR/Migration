import type { StageDiagram } from "../content/diagrams";

// The stage as one picture: layers from the user down to the data, with the concepts on them.
// Tapping a concept opens its card.
export default function StageDiagramView({
  diagram,
  known,
  onOpen,
  highlight,
}: {
  diagram: StageDiagram;
  known: Set<number>;
  onOpen: (n: number) => void;
  /** The concept being learned: marked "you are here". */
  highlight?: number;
}) {
  return (
    <figure className="m-0 rounded-2xl border border-slate-200 bg-white p-3 md:p-5">
      <figcaption className="mb-3 text-sm text-slate-600">
        <strong className="text-slate-800">תמונת השלב · </strong>
        {diagram.caption}
      </figcaption>
      <ol className="flex flex-col items-stretch">
        {diagram.layers.map((layer, i) => (
          <li key={layer.label} className="flex flex-col items-stretch">
            <div className="grid gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 md:grid-cols-[9rem_1fr] md:items-center md:p-3">
              <span className="text-xs font-bold text-slate-500 md:text-sm">
                {layer.label}
              </span>
              <ul className="flex flex-wrap gap-2">
                {layer.nodes.map((node) => {
                  const box = (
                    <>
                      <span
                        className="block font-bold [overflow-wrap:anywhere]"
                        dir="auto"
                      >
                        {node.label}
                      </span>
                      {node.sub && (
                        <span
                          className="block text-[11px] font-normal opacity-80 [overflow-wrap:anywhere]"
                          dir="auto"
                        >
                          {node.sub}
                        </span>
                      )}
                    </>
                  );
                  return (
                    <li
                      key={node.label}
                      className="min-w-[8.5rem] flex-1 sm:flex-none"
                    >
                      {node.concept ? (
                        <button
                          type="button"
                          onClick={() => onOpen(node.concept!)}
                          className={`relative min-h-11 w-full rounded-xl border-2 px-3 py-1.5 text-center text-sm transition hover:-translate-y-0.5 hover:shadow ${
                            highlight === node.concept
                              ? "border-amber-500 bg-amber-100 text-amber-950 ring-4 ring-amber-200"
                              : known.has(node.concept)
                                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                : "border-indigo-300 bg-white text-indigo-900"
                          }`}
                        >
                          {box}
                          <span
                            className="absolute -top-2 end-2 rounded-full bg-indigo-700 px-1.5 text-[10px] font-bold text-white"
                            dir="ltr"
                          >
                            #{node.concept}
                          </span>
                        </button>
                      ) : (
                        <div className="min-h-11 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-1.5 text-center text-sm text-slate-600">
                          {box}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            {i < diagram.layers.length - 1 && (
              <span
                aria-hidden
                className="py-0.5 text-center text-lg leading-none text-slate-300"
              >
                ↓
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-slate-400">
        לחצו על רכיב כדי לפתוח את כרטיס המושג שלו.
      </p>
    </figure>
  );
}
