"use client";

import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import styles from "./ExploreBountiesPage.module.css";


type Bounty = {
  id: string;
  title: string;
  description: string;
  type: string | null;
  reward_amount: number | string | null;
  deadline: string | null;
  created_at: string | null;
  status?: string | null;
};

const categoryLabels: Record<string, string> = {
  code: "Code",
  development: "Code",
  dev: "Code",
  design: "Design",
  content: "Content",
  documentation: "Docs",
  docs: "Docs",
  research: "Research",
  community: "Community",
  security: "Security",
};

function normalizeType(type: string | null) {
  if (!type) return "Other";
  const key = type.trim().toLowerCase();
  return categoryLabels[key] ?? type.trim();
}

function formatAda(value: Bounty["reward_amount"]) {
  if (value === null || value === undefined || value === "") return "Reward TBD";
  const amount = Number(value);
  if (Number.isNaN(amount)) return `${value} ADA`;
  return `${new Intl.NumberFormat("en-US").format(amount)} ADA`;
}

function formatDate(value: string | null) {
  if (!value) return "Rolling deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Rolling deadline";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDeadlineState(value: string | null) {
  if (!value) return "Open";
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return "Open";

  const diff = deadline.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Reviewing";
  if (days === 0) return "Due today";
  if (days <= 7) return `${days}d left`;
  return "Open";
}

export function ExploreBountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("All");

  useEffect(() => {
    let isMounted = true;

    async function loadBounties() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/bounties", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load bounties right now.");
        }

        const data = (await response.json()) as Bounty[];
        if (isMounted) setBounties(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load bounties right now.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBounties();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueTypes = new Set(bounties.map((bounty) => normalizeType(bounty.type)));
    return ["All", ...Array.from(uniqueTypes).sort()];
  }, [bounties]);

  const filteredBounties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bounties.filter((bounty) => {
      const type = normalizeType(bounty.type);
      const matchesType = activeType === "All" || type === activeType;
      const searchable = `${bounty.title} ${bounty.description} ${type}`.toLowerCase();
      return matchesType && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeType, bounties, query]);

  const totalRewards = useMemo(
    () =>
      bounties.reduce((sum, bounty) => {
        const amount = Number(bounty.reward_amount);
        return Number.isNaN(amount) ? sum : sum + amount;
      }, 0),
    [bounties],
  );

  return (
    <main className={`page ${styles.explorePage}`}>
      <Header />

      <section className={styles.exploreHero}>
        <div className={`container ${styles.exploreHeroGrid}`}>
          <div className={styles.exploreHeroCopy}>
            <span className="eyebrow">
              <i /> Open contribution board
            </span>
            <h1>Explore live bounties</h1>
            <p>
              Find open tasks across engineering, design, content, research, and community work.
              Choose a bounty that matches your skillset and contribute where the ecosystem needs help.
            </p>
          </div>

          <div className={styles.exploreSummary} aria-label="Bounty board summary">
            <div>
              <span>Open bounties</span>
              <strong>{isLoading ? "--" : bounties.length}</strong>
            </div>
            <div>
              <span>Total rewards</span>
              <strong>{isLoading ? "--" : formatAda(totalRewards)}</strong>
            </div>
            <div>
              <span>Categories</span>
              <strong>{isLoading ? "--" : Math.max(categories.length - 1, 0)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.exploreBoard} aria-label="Explore bounties">
        <div className="container">
          <div className={styles.exploreToolbar}>
            <label className={styles.searchField}>
              <span>Search bounties</span>
              <input
                type="search"
                value={query}
                placeholder="Search by title, type, or brief"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className={styles.typeFilters} aria-label="Filter by bounty type">
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeType === category ? styles.isActive : ""}
                  type="button"
                  onClick={() => setActiveType(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className={styles.bountyGrid} aria-label="Loading bounties">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <article className={`${styles.bountyCard} ${styles.bountyCardSkeleton}`} key={item}>
                  <span />
                  <h2 />
                  <p />
                  <p />
                </article>
              ))}
            </div>
          ) : error ? (
            <div className={styles.exploreState} role="alert">
              <h2>Could not load bounties</h2>
              <p>{error}</p>
            </div>
          ) : filteredBounties.length === 0 ? (
            <div className={styles.exploreState}>
              <h2>No matching bounties</h2>
              <p>Try a broader search or switch to another bounty type.</p>
            </div>
          ) : (
            <div className={styles.bountyGrid}>
              {filteredBounties.map((bounty) => (
                <article className={styles.bountyCard} id={bounty.id} key={bounty.id}>
                  <div className={styles.bountyCardTop}>
                    <span>{normalizeType(bounty.type)}</span>
                    <b>{getDeadlineState(bounty.deadline)}</b>
                  </div>
                  <h2>{bounty.title}</h2>
                  <p>{bounty.description}</p>
                  <dl className={styles.bountyMeta}>
                    <div>
                      <dt>Reward</dt>
                      <dd>{formatAda(bounty.reward_amount)}</dd>
                    </div>
                    <div>
                      <dt>Deadline</dt>
                      <dd>{formatDate(bounty.deadline)}</dd>
                    </div>
                  </dl>
                  <a className={styles.bountyAction} href={`#${bounty.id}`}>
                    View bounty
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
