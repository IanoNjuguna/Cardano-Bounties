import React from "react";
import { features } from "./constants";

function FeatureMock({ type }: { type: string }) {
  if (type === "time") {
    return (
      <div className="time-visual">
        <div className="timer-card">
          <b>UI/UX Review Audit</b>
          <span>Protocol Landing Page</span>
          <button>Review Assets</button>
        </div>
        <div className="meeting-card">
          <b>Design System Sync</b>
          <span>Sprint 14 Review</span>
          <nav><i>Assets</i><i>Colors</i><i>Feedback</i></nav>
          {["Alex Chen", "Sarah Miller", "David Kim"].map((name, index) => (
            <div key={name}>
              <p>{name}</p>
              <em>{["Reviewed", "In Review", "Draft"][index]}</em>
            </div>
          ))}
          <small>Open Figma File</small>
        </div>
      </div>
    );
  }

  if (type === "integrations") {
    return (
      <div className="integration-visual">
        <span className="logo microsoft" title="Guides">{"\u270e"}</span>
        <span className="logo drive" title="Docs">{"\u25a4"}</span>
        <span className="logo figma" title="Technical">{"\u270d"}</span>
        <span className="logo vimeo" title="Video">v</span>
        <span className="logo slack" title="Support">?</span>
        <i className="line line-a" />
        <i className="line line-b" />
        <i className="line line-c" />
      </div>
    );
  }

  if (type === "collaboration") {
    return (
      <div className="collab-visual">
        <i className="arc arc-one" />
        <i className="arc arc-two" />
        <span className="person person-one" />
        <span className="person person-two" />
        <span className="person person-three" />
      </div>
    );
  }

  return (
    <div className="task-visual">
      <div className="candidate-card card-main">
        <span style={{ color: "var(--blue)" }}>{"\u27e8\u27e9"}</span>
        <small>Smart Contract</small>
        <b>Plutus V3</b>
        <h4>Contract Security Audit</h4>
        <p>Expert <i>Audit report needed</i></p>
        <em>2,500 - 5,000 ADA</em>
        <button>Claim Bounty</button>
      </div>
      <div className="candidate-card card-back">
        <span style={{ color: "#111" }}>{"\u27e8\u27e9"}</span>
        <b>Cardano SDK</b>
        <h4>Wallet Integration</h4>
        <button>View Details</button>
      </div>
    </div>
  );
}

function FeatureCopy({ title, text }: { title: string; text: string }) {
  return (
    <div className="feature-copy">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function Features() {
  return (
    <section className="section soft-section" id="features">
      <div className="container">
        <div className="section-heading">
          <span className="pill">What you can work on</span>
          <h2>Bounties for every kind<br />of contributor</h2>
        </div>
        <div className="feature-grid">
          {features.map((item) => (
            <article className={`feature-card feature-${item.type}`} key={item.title}>
              <div className="mock-panel"><FeatureMock type={item.type} /></div>
              <FeatureCopy title={item.title} text={item.text} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
