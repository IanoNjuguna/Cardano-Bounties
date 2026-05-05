import React from "react";
import { liveBounties } from "./constants";
import { ArrowRight } from "lucide-react";

export function FeaturedBounties() {
  return (
    <section className="section bg-[var(--wash)]" id="featured-bounties">
      <div className="container">
        <div className="section-heading flex flex-col items-center text-center mb-12">
          <span className="pill mb-4">Live Now</span>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
            Featured Bounties
          </h2>
          <p className="section-intro mt-4 max-w-2xl text-[var(--muted)] text-base md:text-lg">
            Start contributing today. Browse our top picks for open bounties and earn ADA for your work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveBounties.map((bounty, idx) => (
            <article 
              key={idx} 
              className="flex flex-col bg-white border border-[var(--line)] rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-[var(--shadow-card)] hover:-translate-y-1 hover:border-[var(--blue)] group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                  {bounty.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full bg-[var(--section)] border border-[var(--line-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex-shrink-0 ml-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[var(--blue-dark)] whitespace-nowrap">
                  {bounty.reward}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-[var(--ink)] mb-3 leading-snug">
                {bounty.title}
              </h3>
              
              <p className="text-[var(--muted)] text-sm leading-relaxed mb-8 flex-grow">
                {bounty.description}
              </p>
              
              <a 
                href={bounty.link} 
                className="mt-auto inline-flex items-center text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-dark)] transition-colors"
              >
                View Bounty Details
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </article>
          ))}
        </div>
        
        <div className="mt-12 flex justify-center">
          <a className="button button-secondary px-6 py-3 text-sm font-medium rounded-full" href="#explore">
            View All Bounties
          </a>
        </div>
      </div>
    </section>
  );
}
