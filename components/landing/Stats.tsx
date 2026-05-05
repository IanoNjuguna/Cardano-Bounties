import React from "react";

const statsData = [
  ["200+", "Waitlist members"],
  ["6", "Bounty categories"],
  ["₳ ADA", "Rewards paid on-chain"],
  ["Open", "To all skill levels"],
];

export function Stats() {
  return (
    <section className="stats-section" id="leaderboard">
      <div className="container stats-grid">
        {statsData.map(([value, label]) => (
          <div className="stat-card" key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
