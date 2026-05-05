import React from "react";
import { faqs } from "./constants";
import { FaqList } from "./FaqList";

export function Faq() {
  return (
    <section className="section faq-section">
      <div className="container narrow">
        <div className="section-heading">
          <span className="pill">Why Cardano</span>
          <h2>A blockchain built for real-world contribution</h2>
        </div>
        <FaqList items={faqs} />
      </div>
    </section>
  );
}
