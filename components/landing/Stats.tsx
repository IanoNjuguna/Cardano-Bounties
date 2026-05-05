"use client";
import React, { useEffect, useState } from "react";

const initialStats = [
  ["200+", "Waitlist members"],
  ["6", "Bounty categories"],
  ["₳ ADA", "Rewards paid on-chain"],
  ["Open", "To all skill levels"],
];

export function Stats() {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    async function fetchWaitlistCount() {
      try {
        const response = await fetch("/api/waitlist");
        const data = await response.json();
        if (data.count !== undefined) {
          setStats((prev) => {
            const newStats = [...prev];
            newStats[0] = [`${data.count}`, "Waitlist members"];
            return newStats;
          });
        }
      } catch (error) {
        console.error("Failed to fetch waitlist count:", error);
      }
    }

    fetchWaitlistCount();
  }, []);

  return (
    <section className="stats-section" id="leaderboard">
      <div className="container stats-grid">
        {stats.map(([value, label]) => (
          <div className="stat-card" key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
