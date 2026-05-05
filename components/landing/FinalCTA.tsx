import React from "react";
import { WaitlistForm } from "./WaitlistForm";

export function FinalCTA() {
  return (
    <section className="final-wrap" id="waitlist">
      <div className="container">
        <div className="final-cta">
          <h2>Be among the first contributors on Cardano Bounties</h2>
          <div>
            <p>We&apos;re in pre-launch and building our founding community. Join the waitlist to get notified the moment the first bounties go live.</p>
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}
