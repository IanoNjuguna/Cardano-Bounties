import Link from "next/link";
import React from "react";
import { testimonials } from "./constants";
import styles from "./Testimonials.module.css";

export function Testimonials() {
  return (
    <section className="section testimonials-section" id="testimonials">
      <div className="container">
        <div className="section-heading">
          <span className="pill">For protocols & projects</span>
          <h2>Want to post a bounty?</h2>
          <p className="section-intro">Cardano Bounties is currently in pre-launch. During this phase, all bounties are posted and managed by the platform admin to ensure quality and fair reward structures.</p>
        </div>
        <div className={styles.posterBountyGrid}>
          {testimonials.map(([name, role, quote], index) => (
            <article
              className={`${styles.posterBountyCard} ${index === 0 ? styles.isFeatured : ""}`}
              key={name}
            >
              <div className={styles.posterCardHead}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p><b>{name}</b>{role}</p>
              </div>
              <p>{quote}</p>
              <div className={styles.posterCardMeta}>
                <span>{index === 0 ? "High value" : "Admin reviewed"}</span>
                <span>{index === 1 ? "Design-ready" : "Clear scope"}</span>
              </div>
            </article>
          ))}
        </div>
        <Link className={styles.posterBountyCta} href="/post-bounty">Post a bounty</Link>
      </div>
    </section>
  );
}
