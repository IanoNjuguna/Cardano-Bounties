import React from "react";

export function Hero() {
  return (
    <section className="hero-section">
      <div className="container hero-inner">
        <span className="eyebrow"><i /> Built on Cardano · Pre-launch</span>
        <h1>
          From Learning to Earning,
          <br />
          Contribute to Cardano and Get Paid in ADA
        </h1>
        <p>Cardano bounties is an open platform where anyone regardless of experience or skill level can contribute to the Cardano ecosystem. Explore tasks, build in public, and earn ADA while contributing to real projects.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#waitlist">Join the Waitlist</a>
          <a className="button button-secondary" href="#pricing">See How It Works</a>
        </div>
        <div className="trust-nudge">No account needed · Connect your Cardano wallet · Free to participate</div>

        <div className="hero-product-wrapper">
          <div className="hero-product" aria-label="TaskMaster dashboard preview">
          <section className="today-panel">
            <div className="today-head">
              <h2>Open Bounties</h2>
              <a href="#features">Explore {"\u203a"}</a>
            </div>
            <div className="today-cards">
              {["Plutus starter guide", "Wallet UI audit"].map((title, index) => (
                <article key={`${title}-${index}`}>
                  <div>
                    <h3>{title}</h3>
                    <button aria-label="More options">••</button>
                  </div>
                  <p>{index === 0 ? "Write a beginner-friendly guide for new Cardano developers..." : "Review a wallet flow and suggest practical UX improvements..."}</p>
                  <div className="mini-avatars">
                    <span />
                    <span />
                    <span />
                    <b>2+</b>
                  </div>
                  <div className="mini-progress"><i style={{ width: index === 0 ? "65%" : "60%" }} /></div>
                </article>
              ))}
            </div>
            <div className="toast">
              <span>💙</span>
              <p>New beginner-friendly ADA bounties opening soon.</p>
              <button aria-label="Dismiss">×</button>
            </div>
          </section>

          </div>
        </div>
      </div>
    </section>
  );
}
