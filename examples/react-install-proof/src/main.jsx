import React from "react";
import { createRoot } from "react-dom/client";
import { Wgd } from "@wgd-ai/react";
import "@wgd-ai/core/style.css";
import "./proof.css";

const config = {
  resolver: async (request) => ({
    version: "1",
    requestId: request.requestId,
    intent: request.intent,
    status: "ok",
    title: "Show the evidence",
    reasons: [
      {
        label: "support",
        detail: "This response is rendered by @wgd-ai/react installed from the public npm registry."
      },
      {
        label: "package",
        detail: "@wgd-ai/react@0.12.0-alpha.1"
      }
    ]
  })
};

function App() {
  return (
    <main className="proof-shell">
      <div className="proof-card">
        <div className="eyebrow">EXTERNAL INSTALL PROOF</div>
        <h1>WGD from npm.</h1>
        <p>This app is intentionally separate from the WGD runtime source. It consumes the published package exactly like another developer would.</p>
        <div className="claim-row">
          <Wgd
            intent="evidence"
            context={{ claim: "The published React package works in a fresh app" }}
            config={config}
            label="Show the evidence"
          >
            <strong>The published React package works in a fresh app.</strong>
          </Wgd>
        </div>
        <code>npm install @wgd-ai/react@alpha</code>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
