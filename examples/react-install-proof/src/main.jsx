import React from "react";
import { createRoot } from "react-dom/client";
import { Wgd } from "@wgd-ai/react";
import "@wgd-ai/core/style.css";
import "./proof.css";

const config = {
  resolver: async (request) => ({
    version: "0.1",
    requestId: request.requestId,
    intent: request.intent,
    status: "ok",
    title: "Show the evidence",
    summary: "This response is rendered by @wgd-ai/react installed from the public npm registry.",
    data: {
      items: [
        {
          id: "package-proof",
          claim: "The external app is running @wgd-ai/react@0.12.0-alpha.3.",
          source: "package.json",
          strength: "direct",
          direction: "supports"
        }
      ],
      gaps: [],
      contradictions: []
    },
    caveats: []
  })
};

function App() {
  return (
    <main className="proof-shell">
      <div className="proof-card">
        <div className="eyebrow">EXTERNAL INSTALL PROOF · PROTOCOL 0.1</div>
        <h1>WGD from npm.</h1>
        <p>This app is intentionally separate from the WGD runtime source. It consumes the published package exactly like another developer would.</p>
        <div className="claim-row">
          <Wgd
            intent="evidence"
            subjectType="claim"
            context={{ claim: "The published React package works in a fresh app" }}
            permissions={{ allowedSources: ["package.json"], allowExternalLookup: false }}
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
