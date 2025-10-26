
// src/components/ProductPanel.tsx
import React from "react";
import { useAtomValue } from "jotai";
import { panelViewModelAtom } from "../state/selectors";

export function ProductPanel() {
  const vm = useAtomValue(panelViewModelAtom);

  if (vm.panelMode === "compactWaitlistOnly") {
    return (
      <div role="status" style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
        <strong>Event Full</strong>
        <div>Join the waitlist to be notified if spots open.</div>
        {/* Hook a waitlist CTA here as appropriate for your app */}
        <button>Join Waitlist</button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {vm.sections.map((sec) => (
        <section key={sec.id} aria-label={sec.labelResolved} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <header style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>{sec.labelResolved}</h3>
          </header>

          {sec.items.map((row) => (
            <article key={row.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: 8, borderTop: "1px solid #eee" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{row.name}</div>

                {/* Notices */}
                {row.notices.map((n, i) => (
                  <div key={i} role="status" style={{ fontSize: 12, opacity: 0.9 }}>
                    {n.title && <strong>{n.title}</strong>} {n.text}
                    {n.meta && <div>{n.meta}</div>}
                  </div>
                ))}

                {/* Badges / Low inventory */}
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {row.lowInventory && <span>Only a few left</span>}
                  {row.badges?.map((b, i) => (
                    <span key={i} style={{ marginLeft: 8 }}>{b}</span>
                  ))}
                </div>
              </div>

              {/* Right column: quantity + CTA */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Quantity UI (hidden/select/stepper) — this is a placeholder UI */}
                {row.quantityUI === "select" && <button>Select</button>}
                {row.quantityUI === "stepper" && (
                  <div aria-label="quantity control" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <button aria-label="decrease">−</button>
                    <span>0</span>
                    <button aria-label="increase">+</button>
                  </div>
                )}

                {/* CTA */}
                {row.cta.kind !== "none" && (
                  <button disabled={!row.cta.enabled} title={row.cta.disabledReason || undefined}>
                    {row.cta.label}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      ))}

      {/* Pricing footer (server-computed) */}
      {vm.pricing?.showPriceSummary && vm.pricing?.summary && (
        <footer aria-label="Price Summary" style={{ borderTop: "2px solid #ddd", paddingTop: 8 }}>
          {vm.pricing.summary.lines.map((line, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ textTransform: "capitalize" }}>{line.type}</span>
              <span>
                {line.amount.currency} {((line.amount.amount ?? 0) / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </footer>
      )}
    </div>
  );
}
