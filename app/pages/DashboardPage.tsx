"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { useAppWallet } from "@/components/wallet/WalletProvider";
import { useToast } from "@/components/toast/ToastProvider";
import { authFetch } from "@/lib/api";
import styles from "./DashboardPage.module.css";

type Bounty = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  custom_type?: string | null;
  status: string;
  reward_amount?: number | string | null;
  total_funding_amount?: number | string | null;
  escrow_address?: string | null;
  escrow_tx_hash?: string | null;
  escrow_submitted_at?: string | null;
  escrow_confirmed_at?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  submissions?: Submission[];
};

type Submission = {
  id: string;
  bounty_id?: string | null;
  contributor_id?: string | null;
  content?: string | null;
  status: string;
  feedback?: string | null;
  poster_review_status?: string | null;
  poster_feedback?: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  paid_at?: string | null;
  transaction_hash?: string | null;
  bounties?: Bounty | Bounty[] | null;
  bounty?: Bounty;
};

type DashboardResponse = {
  role: "admin" | "poster";
  metrics: Record<string, number>;
  queues: {
    bounty_reviews?: Bounty[];
    pending_submissions?: Submission[];
    approved_payouts?: Submission[];
    refund_candidates?: Bounty[];
    non_live_bounties?: Bounty[];
    bounties?: Bounty[];
    pending_submission_reviews?: Submission[];
    submissions?: Submission[];
  };
  recent_activity?: Bounty[];
  error?: string;
};

function formatAda(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(amount)} ADA`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeStatus(value: string | null | undefined) {
  if (!value) return "Pending";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSubmissionBounty(submission: Submission) {
  if (submission.bounty) return submission.bounty;
  if (Array.isArray(submission.bounties)) return submission.bounties[0];
  return submission.bounties || null;
}

function canAdminReviewBounty(bounty: Bounty) {
  return bounty.status === "awaiting_admin_review";
}

function getFundingState(bounty: Bounty) {
  if (bounty.escrow_confirmed_at) return "Escrow confirmed";
  if (bounty.escrow_tx_hash) return "Escrow submitted";
  return "Awaiting escrow";
}

export function DashboardPage() {
  const { connected, isAuthenticated, role, reauthenticate } = useAppWallet();
  const toast = useToast();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const dashboardRole = role === "admin" ? "admin" : "poster";

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch(`/api/dashboard/${dashboardRole}`, {
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as DashboardResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load dashboard.");
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [dashboardRole, isAuthenticated]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function ensureAuth() {
    if (!connected) throw new Error("Connect your wallet first.");
    if (!isAuthenticated) await reauthenticate();
  }

  async function runAction(id: string, action: () => Promise<Response>, successMessage: string) {
    setActionId(id);
    try {
      await ensureAuth();
      const response = await action();
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Action failed.");
      }

      toast.success("Dashboard updated", successMessage);
      await loadDashboard();
    } catch (err) {
      toast.error("Action failed", err instanceof Error ? err.message : "Unable to complete action.");
    } finally {
      setActionId("");
    }
  }

  const metrics = useMemo(() => {
    if (!data) return [];
    if (dashboardRole === "admin") {
      return [
        ["Awaiting bounty review", data.metrics.awaiting_bounty_reviews || 0],
        ["Not live bounties", data.metrics.not_live_bounties || 0],
        ["Pending submissions", data.metrics.pending_submissions || 0],
        ["Queued payout value", formatAda(data.metrics.queued_payout_ada || 0)],
      ];
    }

    return [
      ["My bounties", data.metrics.total_bounties || 0],
      ["Open bounties", data.metrics.open_bounties || 0],
      ["Submission reviews", data.metrics.pending_submission_reviews || 0],
      ["Committed rewards", formatAda(data.metrics.committed_ada || 0)],
    ];
  }, [dashboardRole, data]);

  const primaryQueueTitle = dashboardRole === "admin" ? "Bounties ready to approve" : "Submissions awaiting poster review";
  const primaryQueue =
    dashboardRole === "admin" ? data?.queues.bounty_reviews || [] : data?.queues.pending_submission_reviews || [];
  const nonLiveBounties = data?.queues.non_live_bounties || [];

  return (
    <main className={styles.dashboardShell}>
      <aside className={styles.sidebar} aria-label="Dashboard navigation">
        <Link className={styles.brand} href="/">
          <Image src="/cardano_bounties_logo.png" alt="Cardano Bounties" width={158} height={62} priority />
        </Link>

        <div className={styles.roleCard}>
          <span>{dashboardRole === "admin" ? "Admin" : "Poster"}</span>
          <strong>{dashboardRole === "admin" ? "Platform operations" : "Project workspace"}</strong>
        </div>

        <nav className={styles.sideNav}>
          <Link href="/dashboard" className={styles.activeNav}>Overview</Link>
          <Link href="/post-bounty">Post bounty</Link>
          <Link href="/explore">Explore</Link>
        </nav>

        <div className={styles.walletSlot}>
          <WalletConnect />
        </div>
      </aside>

      <section className={styles.dashboardMain}>
        <header className={styles.topbar}>
          <div>
            <span className="pill">{dashboardRole === "admin" ? "Admin review" : "Poster review"}</span>
            <h1>{dashboardRole === "admin" ? "Review funded bounties and payouts" : "Manage your bounty pipeline"}</h1>
            <p>
              {dashboardRole === "admin"
                ? "Approve escrow-funded bounties, review submissions, and record payout or refund transactions."
                : "Track bounties you posted, review contributor submissions, and send recommendations to admin review."}
            </p>
          </div>
        </header>

        {!connected ? (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <h2>Connect wallet to view dashboard</h2>
              <p>Your wallet role determines whether you see admin queues or poster queues.</p>
              <WalletConnect />
            </div>
          </section>
        ) : !isAuthenticated ? (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <h2>Sign wallet verification</h2>
              <p>Dashboard actions require an authenticated wallet session.</p>
              <button type="button" onClick={() => void reauthenticate()}>Sign verification</button>
            </div>
          </section>
        ) : isLoading ? (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <h2>Loading dashboard</h2>
              <p>Fetching live bounty and submission queues.</p>
            </div>
          </section>
        ) : error ? (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <h2>Dashboard unavailable</h2>
              <p>{error}</p>
              <button type="button" onClick={() => void loadDashboard()}>Retry</button>
            </div>
          </section>
        ) : (
          <>
            <section className={styles.metricGrid} aria-label="Dashboard metrics">
              {metrics.map(([label, value]) => (
                <article className={styles.metricCard} key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <p>Live from Supabase</p>
                </article>
              ))}
            </section>

            <section className={styles.workspaceGrid}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span>Queue</span>
                    <h2>{primaryQueueTitle}</h2>
                  </div>
                  <button type="button" onClick={() => void loadDashboard()}>Refresh</button>
                </div>

                <div className={styles.queueList}>
                  {primaryQueue.length > 0 ? (
                    primaryQueue.map((item) =>
                      dashboardRole === "admin" ? (
                        <article className={styles.queueItem} key={(item as Bounty).id}>
                          <div>
                            <h3>{(item as Bounty).title}</h3>
                            <p>{normalizeStatus((item as Bounty).status)} - {getFundingState(item as Bounty)}</p>
                          </div>
                          <span>{formatAda((item as Bounty).reward_amount)}</span>
                          <BountyReviewActions bounty={item as Bounty} actionId={actionId} runAction={runAction} />
                        </article>
                      ) : (
                        <article className={styles.queueItem} key={(item as Submission).id}>
                          <div>
                            <h3>{getSubmissionBounty(item as Submission)?.title || "Submission"}</h3>
                            <p>{(item as Submission).content || "No submission notes"}</p>
                          </div>
                          <span>{normalizeStatus((item as Submission).poster_review_status)}</span>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              disabled={actionId === `${(item as Submission).id}:recommended_approval`}
                              onClick={() =>
                                void runAction(
                                  `${(item as Submission).id}:recommended_approval`,
                                  () =>
                                    authFetch(`/api/submissions/${(item as Submission).id}/poster-review`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ status: "recommended_approval" }),
                                    }),
                                  "Submission recommended for admin approval.",
                                )
                              }
                            >
                              Recommend
                            </button>
                            <button
                              type="button"
                              disabled={actionId === `${(item as Submission).id}:changes_requested`}
                              onClick={() =>
                                void runAction(
                                  `${(item as Submission).id}:changes_requested`,
                                  () =>
                                    authFetch(`/api/submissions/${(item as Submission).id}/poster-review`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ status: "changes_requested" }),
                                    }),
                                  "Submission marked for changes.",
                                )
                              }
                            >
                              Changes
                            </button>
                          </div>
                        </article>
                      ),
                    )
                  ) : (
                    <div className={styles.emptyState}>
                      <h2>No items waiting</h2>
                      <p>The current review queue is clear.</p>
                    </div>
                  )}
                </div>
              </div>

              <aside className={styles.healthPanel}>
                <span>Operational health</span>
                <strong>{primaryQueue.length === 0 ? "Clear" : primaryQueue.length}</strong>
                <div className={styles.progressTrack} aria-hidden="true">
                  <i style={{ width: primaryQueue.length === 0 ? "100%" : "54%" }} />
                </div>
                <p>
                  {dashboardRole === "admin"
                    ? "Funded bounties should be approved or rejected before they appear publicly."
                    : "Poster review recommendations help admin process submissions and payouts faster."}
                </p>
              </aside>
            </section>

            {dashboardRole === "admin" ? (
              <>
                <section className={styles.tablePanel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <span>Bounties</span>
                      <h2>All not-live bounties</h2>
                    </div>
                  </div>
                  <AdminBountyTable bounties={nonLiveBounties} actionId={actionId} runAction={runAction} />
                </section>

                <section className={styles.tablePanel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <span>Submissions</span>
                      <h2>Pending admin submission review</h2>
                    </div>
                  </div>
                  <SubmissionTable
                    submissions={data?.queues.pending_submissions || []}
                    actionId={actionId}
                    runAction={runAction}
                  />
                </section>
              </>
            ) : (
              <section className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span>Bounties</span>
                    <h2>My posted bounties</h2>
                  </div>
                </div>
                <BountyTable bounties={data?.queues.bounties || []} />
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function BountyTable({ bounties }: { bounties: Bounty[] }) {
  return (
    <div className={styles.activityTable} role="table" aria-label="Posted bounties">
      <div className={styles.tableHead} role="row">
        <span role="columnheader">Bounty</span>
        <span role="columnheader">Reward</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Updated</span>
      </div>
      {bounties.map((bounty) => (
        <div className={styles.tableRow} role="row" key={bounty.id}>
          <span role="cell">{bounty.title}</span>
          <span role="cell">{formatAda(bounty.reward_amount)}</span>
          <span role="cell"><b>{normalizeStatus(bounty.status)}</b></span>
          <span role="cell">{formatDate(bounty.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

function BountyReviewActions({
  bounty,
  actionId,
  runAction,
}: {
  bounty: Bounty;
  actionId: string;
  runAction: (id: string, action: () => Promise<Response>, successMessage: string) => Promise<void>;
}) {
  const reviewReady = canAdminReviewBounty(bounty);

  return (
    <div className={styles.rowActions}>
      <button
        type="button"
        disabled={!reviewReady || actionId === `${bounty.id}:open`}
        title={reviewReady ? "Approve and publish bounty" : "Bounty must have confirmed escrow before approval"}
        onClick={() =>
          void runAction(
            `${bounty.id}:open`,
            () =>
              authFetch(`/api/bounties/${bounty.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "open" }),
              }),
            "Bounty approved and opened.",
          )
        }
      >
        Approve
      </button>
      <button
        type="button"
        disabled={!reviewReady || actionId === `${bounty.id}:rejected`}
        title={reviewReady ? "Reject bounty" : "Bounty must be in admin review before rejection"}
        onClick={() =>
          void runAction(
            `${bounty.id}:rejected`,
            () =>
              authFetch(`/api/bounties/${bounty.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "rejected" }),
              }),
            "Bounty rejected.",
          )
        }
      >
        Reject
      </button>
    </div>
  );
}

function AdminBountyTable({
  bounties,
  actionId,
  runAction,
}: {
  bounties: Bounty[];
  actionId: string;
  runAction: (id: string, action: () => Promise<Response>, successMessage: string) => Promise<void>;
}) {
  if (bounties.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>No not-live bounties</h2>
        <p>Every funded bounty is either public, completed, or already processed.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.activityTable} ${styles.adminBountyTable}`} role="table" aria-label="Not-live bounties">
      <div className={styles.tableHead} role="row">
        <span role="columnheader">Bounty</span>
        <span role="columnheader">Funding</span>
        <span role="columnheader">Reward</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Action</span>
      </div>
      {bounties.map((bounty) => (
        <div className={styles.tableRow} role="row" key={bounty.id}>
          <span role="cell">
            <strong>{bounty.title}</strong>
            <small>{bounty.escrow_tx_hash ? bounty.escrow_tx_hash : "No escrow transaction recorded"}</small>
          </span>
          <span role="cell">{getFundingState(bounty)}</span>
          <span role="cell">{formatAda(bounty.reward_amount)}</span>
          <span role="cell"><b>{normalizeStatus(bounty.status)}</b></span>
          <span role="cell" className={styles.tableActions}>
            <BountyReviewActions bounty={bounty} actionId={actionId} runAction={runAction} />
          </span>
        </div>
      ))}
    </div>
  );
}

function SubmissionTable({
  submissions,
  actionId,
  runAction,
}: {
  submissions: Submission[];
  actionId: string;
  runAction: (id: string, action: () => Promise<Response>, successMessage: string) => Promise<void>;
}) {
  return (
    <div className={styles.activityTable} role="table" aria-label="Pending submissions">
      <div className={styles.tableHead} role="row">
        <span role="columnheader">Submission</span>
        <span role="columnheader">Poster Rec.</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Action</span>
      </div>
      {submissions.map((submission) => (
        <div className={styles.tableRow} role="row" key={submission.id}>
          <span role="cell">{getSubmissionBounty(submission)?.title || submission.content || "Submission"}</span>
          <span role="cell">{normalizeStatus(submission.poster_review_status)}</span>
          <span role="cell"><b>{normalizeStatus(submission.status)}</b></span>
          <span role="cell" className={styles.tableActions}>
            <button
              type="button"
              disabled={actionId === `${submission.id}:approve`}
              onClick={() =>
                void runAction(
                  `${submission.id}:approve`,
                  () =>
                    authFetch(`/api/submissions/${submission.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "approved" }),
                    }),
                  "Submission approved for payout.",
                )
              }
            >
              Approve
            </button>
            <button
              type="button"
              disabled={actionId === `${submission.id}:reject`}
              onClick={() =>
                void runAction(
                  `${submission.id}:reject`,
                  () =>
                    authFetch(`/api/submissions/${submission.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "rejected" }),
                    }),
                  "Submission rejected.",
                )
              }
            >
              Reject
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
