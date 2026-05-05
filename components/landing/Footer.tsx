import React from "react";

export function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#">
              <img className="brand-logo footer-logo" src="/cardano_bounties_logo.png" alt="Cardano Bounties" />
            </a>
            <p>Learn, contribute, and earn in the Cardano ecosystem.</p>
          </div>
          <div>
            <h3>Platform</h3>
            <a href="#features">Explore Bounties</a>
            <a href="#pricing">How It Works</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href="#waitlist">Join Waitlist</a>
          </div>
          <div>
            <h3>For Projects</h3>
            <a href="#contact">Post a Bounty</a>
            <a href="#contact">Contact Admin</a>
          </div>
          <div>
            <h3>Community</h3>
            <a href="https://x.com/cardanobounties" target="blank">Follow on X (Twitter)</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Cardano Bounties. All rights reserved.</p>
          <p>Cardano Bounties is not affiliated with or endorsed by IOHK, Cardano Foundation, or Emurgo.</p>
          <p>Built with ❤️ by <a href="https://x.com/TechKr_Team" target="_blank" rel="noopener noreferrer">TechKR</a> and <a href="https://gimbalabs.com" target="_blank" rel="noopener noreferrer">Gimbalabs</a>.</p>
        </div>
      </div>
    </footer>
  );
}
