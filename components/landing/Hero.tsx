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

          <section className="dashboard">
            <div className="dashboard-main">
              <div className="dashboard-toolbar">
                <span>Table</span>
                <span className="active">Kanban</span>
                <span>List</span>
                <span>Calendar</span>
                <p>January 2026</p>
                <em>Owners</em>
                <em>Filter</em>
              </div>
              <div className="kanban">
                {[
                  ["Backlog", "Logo Options", "Landing Page Draft", "Create UX/UI"],
                  ["To-Do", "Landing Page Dev", "Content Review", "POS Dashboard"],
                  ["In Progress", "Tasks Dashboard", "Filter Dashboard"],
                  ["Done", "Wireframe Design", "Scope Meeting"],
                ].map(([column, ...tasks]) => (
                  <div className="kanban-column" key={column}>
                    <h3>{column}</h3>
                    {tasks.map((task, index) => (
                      <article key={task}>
                        <h4>{task}</h4>
                        <small>{index % 2 === 0 ? "Design" : "Dev"}</small>
                        <div><span /><i style={{ width: `${42 + index * 18}%` }} /></div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
    </section>
  );
}
