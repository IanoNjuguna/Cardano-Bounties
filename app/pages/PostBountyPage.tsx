"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import styles from "./PostBountyPage.module.css";

type BountyForm = {
  title: string;
  type: string;
  reward_amount: string;
  deadline: string;
  created_by: string;
  description: string;
};

type FieldErrors = Partial<Record<keyof BountyForm, string>>;

const bountyTypes = ["Development", "Design", "Content", "Documentation", "Research", "Community", "Security"];

const initialForm: BountyForm = {
  title: "",
  type: "Development",
  reward_amount: "",
  deadline: "",
  created_by: "",
  description: "",
};

function validateForm(form: BountyForm) {
  const errors: FieldErrors = {};
  const reward = Number(form.reward_amount);

  if (!form.title.trim()) errors.title = "Add a clear bounty title.";
  if (!form.type.trim()) errors.type = "Choose a bounty type.";
  if (!form.description.trim()) errors.description = "Describe the work and expected outcome.";
  if (form.description.trim() && form.description.trim().length < 40) {
    errors.description = "Use at least 40 characters so contributors understand the brief.";
  }
  if (form.reward_amount.trim() && (Number.isNaN(reward) || reward < 0)) {
    errors.reward_amount = "Reward must be a positive ADA amount.";
  }

  return errors;
}

export function PostBountyPage() {
  const [form, setForm] = useState<BountyForm>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdTitle, setCreatedTitle] = useState("");

  const rewardPreview = useMemo(() => {
    const amount = Number(form.reward_amount);
    if (!form.reward_amount || Number.isNaN(amount)) return "Reward TBD";
    return `${new Intl.NumberFormat("en-US").format(amount)} ADA`;
  }, [form.reward_amount]);

  function updateField(field: keyof BountyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError("");
    setCreatedTitle("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        reward_amount: form.reward_amount ? Number(form.reward_amount) : null,
        deadline: form.deadline || null,
        created_by: form.created_by.trim() || null,
      };

      const response = await fetch("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string; title?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to post this bounty right now.");
      }

      setCreatedTitle(data.title || payload.title);
      setForm(initialForm);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to post this bounty right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`page ${styles.postPage}`}>
      <Header />

      <section className={styles.postHero}>
        <div className={`container ${styles.postHeroGrid}`}>
          <div className={styles.postHeroCopy}>
            <span className="eyebrow">
              <i /> Project bounty intake
            </span>
            <h1>Post a Cardano bounty</h1>
            <p>
              Create a focused bounty brief with a clear scope, reward, and deadline so contributors can quickly
              understand the work and decide whether to apply.
            </p>
          </div>

          <aside className={styles.briefPreview} aria-label="Bounty preview">
            <span>Preview</span>
            <h2>{form.title || "Your bounty title"}</h2>
            <p>{form.description || "A concise contributor-facing summary will appear here as you write the brief."}</p>
            <dl>
              <div>
                <dt>Type</dt>
                <dd>{form.type}</dd>
              </div>
              <div>
                <dt>Reward</dt>
                <dd>{rewardPreview}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{form.deadline || "Rolling"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={`container ${styles.formGrid}`}>
          <form className={styles.bountyForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.formHeader}>
              <span>Bounty details</span>
              <h2>Describe the work clearly</h2>
              <p>Required fields match the current bounty API: title, description, and type.</p>
            </div>

            {createdTitle ? (
              <div className={styles.successMessage} role="status">
                <strong>Bounty posted.</strong>
                <span>{createdTitle} is now submitted as an open bounty.</span>
              </div>
            ) : null}

            {submitError ? (
              <div className={styles.errorMessage} role="alert">
                {submitError}
              </div>
            ) : null}

            <div className={styles.fieldGroup}>
              <label htmlFor="title">Bounty title</label>
              <input
                id="title"
                type="text"
                value={form.title}
                placeholder="Example: Build a wallet onboarding checklist"
                onChange={(event) => updateField("title", event.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title ? <span id="title-error">{errors.title}</span> : null}
            </div>

            <div className={styles.splitFields}>
              <div className={styles.fieldGroup}>
                <label htmlFor="type">Bounty type</label>
                <select id="type" value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                  {bountyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type ? <span>{errors.type}</span> : null}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reward">Reward amount</label>
                <input
                  id="reward"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.reward_amount}
                  placeholder="1200"
                  onChange={(event) => updateField("reward_amount", event.target.value)}
                  aria-invalid={Boolean(errors.reward_amount)}
                  aria-describedby={errors.reward_amount ? "reward-error" : undefined}
                />
                {errors.reward_amount ? <span id="reward-error">{errors.reward_amount}</span> : null}
              </div>
            </div>

            <div className={styles.splitFields}>
              <div className={styles.fieldGroup}>
                <label htmlFor="deadline">Deadline</label>
                <input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(event) => updateField("deadline", event.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="created-by">Project or poster ID</label>
                <input
                  id="created-by"
                  type="text"
                  value={form.created_by}
                  placeholder="Optional until wallet auth is connected"
                  onChange={(event) => updateField("created_by", event.target.value)}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="description">Bounty brief</label>
              <textarea
                id="description"
                value={form.description}
                placeholder="Explain the goal, deliverables, acceptance criteria, and any links contributors need."
                rows={8}
                onChange={(event) => updateField("description", event.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              {errors.description ? <span id="description-error">{errors.description}</span> : null}
            </div>

            <div className={styles.formActions}>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting bounty..." : "Post bounty"}
              </button>
              <Link href="/explore">View bounties</Link>
            </div>
          </form>

          <aside className={styles.guidancePanel}>
            <span>Before posting</span>
            <h2>What strong bounties include</h2>
            <ul>
              <li>One clear outcome contributors can deliver.</li>
              <li>Acceptance criteria that make review straightforward.</li>
              <li>Reward amount or a note that reward is still being finalized.</li>
              <li>Context links, design files, repos, or references when available.</li>
            </ul>
            <div>
              <strong>Current API status</strong>
              <p>This page posts directly to the existing public bounty endpoint. Auth-based poster attribution can be added when wallet sessions are wired into the frontend.</p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
