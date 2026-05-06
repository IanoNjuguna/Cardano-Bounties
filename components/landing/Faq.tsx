import React from "react";
import { faqs } from "./constants";
import { FaqList } from "./FaqList";

export function Faq() {
  return (
    <section className="section faq-section" id="faq">
      <div className="container narrow">
        <div className="section-heading">
          <span className="pill">Common Questions</span>
          <h2>Frequently Asked Questions</h2>
          <div className="faq-intro" style={{ marginTop: '24px', textAlign: 'left', color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6' }}>
            <p style={{ fontWeight: '600', color: 'var(--ink)', marginBottom: '8px' }}>Cardano Bounties is an evolving initiative.</p>
            <p>We are actively exploring how contribution-based incentives can unlock global talent, encourage meaningful participation, and accelerate ecosystem growth.</p>
            <p style={{ marginTop: '8px' }}>As an experiment, we will continuously learn, iterate, and improve the system based on community feedback and real-world outcomes. Your participation helps shape what this becomes.</p>
          </div>
        </div>
        <FaqList items={faqs} />
      </div>
    </section>
  );
}
