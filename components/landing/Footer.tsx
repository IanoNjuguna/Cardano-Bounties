import Link from "next/link";
import React from "react";

export function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand" href="/">
              <img className="brand-logo footer-logo" src="/cardano_bounties_logo.png" alt="Cardano Bounties" />
            </Link>
            <p>Learn, contribute, and earn in the Cardano ecosystem.</p>
          </div>
          <div>
            <h3>Platform</h3>
            <Link href="/explore">Explore Bounties</Link>
            <Link href="/#pricing">How It Works</Link>
            <Link href="/#leaderboard">Leaderboard</Link>
            <Link href="/#faq">FAQs</Link>
            <Link href="/#waitlist">Join Waitlist</Link>
          </div>
          <div>
            <h3>For Projects</h3>
            <a href="#contact">Post a Bounty</a>
            <a href="#contact">Contact Admin</a>
          </div>
          <div>
            <h3>Community</h3>
            <a href="https://x.com/cardanobounties" target="_blank" rel="noopener noreferrer">Follow on X (Twitter)</a>
            <a href="https://discord.gg/rbQ97RaNw" target="_blank" rel="noopener noreferrer">Join our Discord</a>
            <a href="https://github.com/Ayomishuga/Cardano-Bounties" target="_blank" rel="noopener noreferrer">Star on GitHub</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Cardano Bounties. All rights reserved.</p>
          <p>Cardano Bounties is not affiliated with or endorsed by IOHK, Cardano Foundation, or Emurgo.</p>
          <p>An experiment built with ❤️ by <a href="https://x.com/TechKr_Team" target="_blank" rel="noopener noreferrer">TechKR</a> and <a href="https://gimbalabs.com" target="_blank" rel="noopener noreferrer">Gimbalabs</a>.</p>
        </div>
      </div>
    </footer>
  );
}
