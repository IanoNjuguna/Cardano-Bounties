"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { useToast } from "@/components/toast/ToastProvider";
import { useAppWallet } from "@/components/wallet/WalletProvider";
import { authFetch } from "@/lib/api";
import { getEscrowLovelace } from "@/lib/cardano/amounts";
import { initiateBountyEscrow } from "@/lib/cardano/transactions/bountyEscrow";
import { MAX_REWARD_ADA, PLATFORM_FEE_RATE } from "@/lib/bountyContract";
import styles from "./PostBountyPage.module.css";

type BountyForm = {
  title: string;
  type: string;
  customType: string;
  reward_amount: string;
  deadline: string;
  created_by: string;
  description: string;
};

type FieldErrors = Partial<Record<keyof BountyForm, string>>;

type CreatedBounty = {
  id?: string;
  title?: string;
  error?: string;
};

const bountyTypes = [
  "Development",
  "Design",
  "Content",
  "Hackathon",
  "Documentation",
  "Research",
  "Community",
  "Security",
  "Other",
];

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
const MIN_TITLE_LENGTH = 8;
const MAX_TITLE_LENGTH = 120;
const MIN_CUSTOM_TYPE_LENGTH = 3;
const MAX_CUSTOM_TYPE_LENGTH = 80;
const MIN_DESCRIPTION_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 2000;
const adaFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

const initialForm: BountyForm = {
  title: "",
  type: "Development",
  customType: "",
  reward_amount: "",
  deadline: "",
  created_by: "",
  description: "",
};

function getBountyType(form: BountyForm) {
  return form.type === "Other" ? form.customType.trim() : form.type;
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isValid ? date : null;
}

function getAmountBreakdown(value: string) {
  const contributorReward = Number(value);

  if (!value || Number.isNaN(contributorReward) || contributorReward <= 0) {
    return {
      contributorReward: 0,
      platformFee: 0,
      totalFunding: 0,
      isValid: false,
    };
  }

  const platformFee = contributorReward * PLATFORM_FEE_RATE;

  return {
    contributorReward,
    platformFee,
    totalFunding: contributorReward + platformFee,
    isValid: true,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function validateForm(form: BountyForm) {
  const errors: FieldErrors = {};
  const reward = Number(form.reward_amount);
  const bountyType = getBountyType(form);
  const title = form.title.trim();
  const description = form.description.trim();
  const today = parseDateValue(getTodayDateValue());
  const deadline = form.deadline ? parseDateValue(form.deadline) : null;

  if (!title) {
    errors.title = "Add a clear bounty title.";
  } else if (title.length < MIN_TITLE_LENGTH) {
    errors.title = `Use at least ${MIN_TITLE_LENGTH} characters for the title.`;
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
  }

  if (!bountyType) {
    errors.type = form.type === "Other" ? "Describe the bounty type you need." : "Choose a bounty type.";
  } else if (form.type === "Other" && bountyType.length < MIN_CUSTOM_TYPE_LENGTH) {
    errors.type = `Use at least ${MIN_CUSTOM_TYPE_LENGTH} characters for the custom type.`;
  } else if (bountyType.length > MAX_CUSTOM_TYPE_LENGTH) {
    errors.type = `Keep the bounty type under ${MAX_CUSTOM_TYPE_LENGTH} characters.`;
  }

  if (!description) {
    errors.description = "Describe the work and expected outcome.";
  } else if (description.length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `Use at least ${MIN_DESCRIPTION_LENGTH} characters so contributors understand the brief.`;
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keep the brief under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  if (!form.reward_amount.trim()) {
    errors.reward_amount = "Add the contributor reward in ADA.";
  } else if (Number.isNaN(reward) || reward <= 0) {
    errors.reward_amount = "Reward must be a positive ADA amount.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(form.reward_amount.trim())) {
    errors.reward_amount = "Use up to two decimal places for ADA.";
  } else if (reward > MAX_REWARD_ADA) {
    errors.reward_amount = `Reward cannot exceed ${adaFormatter.format(MAX_REWARD_ADA)} ADA.`;
  }

  if (form.deadline && !deadline) {
    errors.deadline = "Choose a valid deadline.";
  } else if (deadline && today && deadline < today) {
    errors.deadline = "Deadline cannot be in the past.";
  }

  return errors;
}

export function PostBountyPage() {
  const { wallet, connected, isAuthenticated, reauthenticate } = useAppWallet();
  const toast = useToast();
  const [form, setForm] = useState<BountyForm>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [createdTitle, setCreatedTitle] = useState("");

  const todayDateValue = useMemo(() => getTodayDateValue(), []);
  const displayType = getBountyType(form) || "Custom bounty";
  const amountBreakdown = useMemo(() => getAmountBreakdown(form.reward_amount), [form.reward_amount]);
  const rewardPreview = amountBreakdown.isValid
    ? `${adaFormatter.format(amountBreakdown.contributorReward)} ADA`
    : "Reward TBD";
  const totalFundingPreview = amountBreakdown.isValid
    ? `${adaFormatter.format(amountBreakdown.totalFunding)} ADA`
    : "Funding TBD";

  function updateField(field: keyof BountyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === "customType" ? { type: undefined } : null),
    }));
    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Review the bounty form", "Fix the highlighted fields before funding escrow.");
      return;
    }

    if (!ESCROW_ADDRESS) {
      const message = "Escrow address is not configured. Add NEXT_PUBLIC_ESCROW_ADDRESS before posting bounties.";
      setSubmitError(message);
      toast.error("Escrow is not configured", message);
      return;
    }

    if (!connected || !wallet) {
      const message = "Connect your Cardano wallet before posting a bounty.";
      setSubmitError(message);
      toast.error("Wallet required", message);
      return;
    }

    setIsSubmitting(true);
    setSubmitStep("Preparing bounty...");
    setSubmitError("");
    setCreatedTitle("");

    let createdBountyId = "";
    let escrowTxSubmitted = false;

    try {
      if (!isAuthenticated) {
        setSubmitStep("Requesting wallet signature...");
        await reauthenticate();
      }

      const bountyType = getBountyType(form);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: bountyType,
        reward_amount: amountBreakdown.contributorReward,
        platform_fee_amount: amountBreakdown.platformFee,
        total_funding_amount: amountBreakdown.totalFunding,
        deadline: form.deadline || null,
        created_by: form.created_by.trim() || null,
      };

      setSubmitStep("Creating bounty record...");
      const response = await authFetch("/api/bounties", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as CreatedBounty;

      if (!response.ok) {
        throw new Error(data.error || "Unable to post this bounty right now.");
      }

      if (!data.id) {
        throw new Error("Bounty was created without an id. Escrow could not continue.");
      }

      createdBountyId = data.id;
      toast.info("Bounty created", "Approve the wallet transaction to lock the reward and platform fee.");

      setSubmitStep("Waiting for wallet approval...");
      const escrowLovelace = getEscrowLovelace(form.reward_amount).toString();
      const txHash = await initiateBountyEscrow({
        wallet,
        escrowAddress: ESCROW_ADDRESS,
        lovelace: escrowLovelace,
      });
      escrowTxSubmitted = true;

      setSubmitStep("Recording escrow transaction...");
      const escrowResponse = await authFetch(`/api/bounties/${data.id}/escrow`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: JSON.stringify({
          escrow_tx_hash: txHash,
          escrow_address: ESCROW_ADDRESS,
        }),
      });

      const escrowData = (await escrowResponse.json()) as CreatedBounty;

      if (!escrowResponse.ok) {
        throw new Error(
          escrowData.error ||
            `Escrow transaction submitted, but the app could not save the transaction hash: ${txHash}`,
        );
      }

      setCreatedTitle(data.title || payload.title);
      setForm(initialForm);
      toast.success("Bounty funded", "The bounty has been funded and is now awaiting admin review.");
    } catch (error) {
      const message = getErrorMessage(error, "Unable to post this bounty right now.");

      if (createdBountyId && !escrowTxSubmitted) {
        try {
          await authFetch(`/api/bounties/${createdBountyId}`, {
            method: "DELETE",
            headers: { Accept: "application/json" },
          });
          toast.error("Bounty was not funded", "The unfunded bounty was invalidated. Please start again.");
        } catch {
          toast.error(
            "Escrow failed",
            "The wallet transaction failed, but the app could not invalidate the bounty automatically.",
          );
        }
      } else if (escrowTxSubmitted) {
        toast.error(
          "Escrow record failed",
          "Funds may be locked on-chain, but the transaction hash was not saved. Contact support before retrying.",
        );
      } else {
        toast.error("Bounty posting failed", message);
      }

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
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
                <dd>{displayType}</dd>
              </div>
              <div>
                <dt>Reward</dt>
                <dd>{rewardPreview}</dd>
              </div>
              <div>
                <dt>Total funding</dt>
                <dd>{totalFundingPreview}</dd>
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
              <p>Choose a known bounty category or describe a custom one. Rewards are entered in ADA.</p>
            </div>

            {createdTitle ? (
              <div className={styles.successMessage} role="status">
                <strong>Bounty posted.</strong>
                <span>{createdTitle} is funded and awaiting admin review.</span>
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
                minLength={MIN_TITLE_LENGTH}
                maxLength={MAX_TITLE_LENGTH}
                onChange={(event) => updateField("title", event.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : "title-hint"}
              />
              {errors.title ? <span id="title-error">{errors.title}</span> : null}
              {!errors.title ? (
                <small id="title-hint" className={styles.fieldHint}>
                  {form.title.trim().length}/{MAX_TITLE_LENGTH} characters
                </small>
              ) : null}
            </div>

            <div className={styles.splitFields}>
              <div className={styles.fieldGroup}>
                <label htmlFor="type">Bounty type</label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(event) => {
                    updateField("type", event.target.value);
                    if (event.target.value !== "Other") updateField("customType", "");
                  }}
                  aria-invalid={Boolean(errors.type)}
                  aria-describedby={errors.type ? "type-error" : undefined}
                >
                  {bountyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && form.type !== "Other" ? <span id="type-error">{errors.type}</span> : null}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reward">Contributor reward</label>
                <input
                  id="reward"
                  type="number"
                  min="0"
                  max={MAX_REWARD_ADA}
                  step="0.01"
                  inputMode="decimal"
                  value={form.reward_amount}
                  placeholder="1200"
                  onChange={(event) => updateField("reward_amount", event.target.value)}
                  aria-invalid={Boolean(errors.reward_amount)}
                  aria-describedby={errors.reward_amount ? "reward-error" : "reward-hint"}
                />
                {errors.reward_amount ? <span id="reward-error">{errors.reward_amount}</span> : null}
                {!errors.reward_amount ? (
                  <small id="reward-hint" className={styles.fieldHint}>
                    Enter the contributor reward in ADA. Platform fee is added below.
                  </small>
                ) : null}
              </div>
            </div>

            {form.type === "Other" ? (
              <div className={`${styles.fieldGroup} ${styles.customTypeField}`}>
                <label htmlFor="custom-type">Describe bounty type</label>
                <input
                  id="custom-type"
                  type="text"
                  value={form.customType}
                  placeholder="Example: Tokenomics review, governance facilitation"
                  minLength={MIN_CUSTOM_TYPE_LENGTH}
                  maxLength={MAX_CUSTOM_TYPE_LENGTH}
                  onChange={(event) => updateField("customType", event.target.value)}
                  aria-invalid={Boolean(errors.type)}
                  aria-describedby={errors.type ? "custom-type-error" : "custom-type-hint"}
                />
                {errors.type ? <span id="custom-type-error">{errors.type}</span> : null}
                {!errors.type ? (
                  <small id="custom-type-hint" className={styles.fieldHint}>
                    {form.customType.trim().length}/{MAX_CUSTOM_TYPE_LENGTH} characters
                  </small>
                ) : null}
              </div>
            ) : null}

            <section className={styles.feeBreakdown} aria-label="ADA funding breakdown">
              <div>
                <span>Contributor reward</span>
                <strong>{amountBreakdown.isValid ? adaFormatter.format(amountBreakdown.contributorReward) : "0"} ADA</strong>
              </div>
              <div>
                <span>Platform fee</span>
                <strong>{amountBreakdown.isValid ? adaFormatter.format(amountBreakdown.platformFee) : "0"} ADA</strong>
                <small>10% added automatically</small>
              </div>
              <div>
                <span>Total to fund</span>
                <strong>{amountBreakdown.isValid ? adaFormatter.format(amountBreakdown.totalFunding) : "0"} ADA</strong>
              </div>
            </section>

            <div className={styles.splitFields}>
              <div className={styles.fieldGroup}>
                <label htmlFor="deadline">Deadline</label>
                <input
                  id="deadline"
                  type="date"
                  min={todayDateValue}
                  value={form.deadline}
                  onChange={(event) => updateField("deadline", event.target.value)}
                  aria-invalid={Boolean(errors.deadline)}
                  aria-describedby={errors.deadline ? "deadline-error" : "deadline-hint"}
                />
                {errors.deadline ? <span id="deadline-error">{errors.deadline}</span> : null}
                {!errors.deadline ? (
                  <small id="deadline-hint" className={styles.fieldHint}>
                    Earliest selectable deadline is today.
                  </small>
                ) : null}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="created-by">Project or poster ID</label>
                <input
                  id="created-by"
                  type="text"
                  value={form.created_by}
                  placeholder="Optional project or team name"
                  maxLength={120}
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
                minLength={MIN_DESCRIPTION_LENGTH}
                maxLength={MAX_DESCRIPTION_LENGTH}
                onChange={(event) => updateField("description", event.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "description-error" : "description-hint"}
              />
              {errors.description ? <span id="description-error">{errors.description}</span> : null}
              {!errors.description ? (
                <small id="description-hint" className={styles.fieldHint}>
                  {form.description.trim().length}/{MAX_DESCRIPTION_LENGTH} characters. Include deliverables and acceptance criteria.
                </small>
              ) : null}
            </div>

            <div className={styles.formActions}>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? submitStep || "Posting bounty..." : "Post bounty"}
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
              <p>Wallet authentication is required. After escrow is recorded, the bounty waits for admin review before it appears publicly.</p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
