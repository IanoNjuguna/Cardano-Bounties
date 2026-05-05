import React from "react";
import { features } from "./constants";

function FeatureMock({ type }: { type: string }) {
  if (type === "time") {
    return (
      <div className="time-visual">
        <div className="timer-card">
          <b>Mono project evaluation</b>
          <span>Today at 12:30 - 04:06</span>
          <button>Go to Zoom link</button>
        </div>
        <div className="meeting-card">
          <b>Mono project evaluation</b>
          <span>12:30 - 04:06</span>
          <nav><i>Details</i><i>Participant</i><i>Comment</i></nav>
          {["Jeni Doe", "Mark Hales", "Osuna Matthew"].map((name, index) => (
            <div key={name}>
              <p>{name}</p>
              <em>{["Done", "Progress", "Approval"][index]}</em>
            </div>
          ))}
          <small>Go to Zoom link</small>
        </div>
      </div>
    );
  }

  if (type === "integrations") {
    return (
      <div className="integration-visual">
        <span className="logo microsoft">{"\u25a6"}</span>
        <span className="logo drive">{"\u25b3"}</span>
        <span className="logo figma">{"\u25cf"}</span>
        <span className="logo vimeo">v</span>
        <span className="logo slack">{"\u2723"}</span>
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
        <span>G</span>
        <small>Saved</small>
        <b>Google</b>
        <h4>Graphic Designer</h4>
        <p>Full-time <i>Flexible schedule</i></p>
        <em>$150 - 220k</em>
        <button>Apply now</button>
      </div>
      <div className="candidate-card card-back">
        <span>G</span>
        <b>Google</b>
        <h4>UX Designer</h4>
        <button>Apply now</button>
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
