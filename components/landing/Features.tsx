import React from "react";
import { features } from "./constants";

function FeatureMock({ type }: { type: string }) {
  if (type === "tasks") {
    return <img src="/smart_contract.jpg" alt="Code & Smart Contracts" className="feature-image" />;
  }
  if (type === "time") {
    return <img src="/design_uiux.jpg" alt="Design & UI/UX" className="feature-image" />;
  }
  if (type === "integrations") {
    return <img src="/documentation.jpg" alt="Content & Documentation" className="feature-image" />;
  }
  if (type === "collaboration") {
    return <img src="/community_research.jpg" alt="Community & Research" className="feature-image" />;
  }
  if (type === "hackathons") {
    return <img src="/hackathons.jpg" alt="Hackathons & Events" className="feature-image" />;
  }
  return null;
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
