import React from "react";
import { testimonials } from "./constants";

export function Testimonials() {
  return (
    <section className="section testimonials-section" id="testimonials">
      <div className="container">
        <div className="section-heading">
          <span className="pill">For protocols & projects</span>
          <h2>Want to post a bounty?</h2>
          <p className="section-intro">Cardano Bounties is currently in pre-launch. During this phase, all bounties are posted and managed by the platform admin to ensure quality and fair reward structures.</p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map(([name, role, quote]) => (
            <article className="testimonial-card" key={name}>
              <div>
                <span>{name.split(" ").map((part) => part[0]).join("")}</span>
                <p><b>{name}</b>{role}</p>
              </div>
              <blockquote>{quote}</blockquote>
              <time>10:20 AM - Dec 2, 2024</time>
            </article>
          ))}
        </div>
        <button className="center-button" disabled>Coming Soon</button>
      </div>
    </section>
  );
}
