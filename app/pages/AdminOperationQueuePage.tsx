"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { authFetch } from "@/lib/api";
import styles from "./DashboardPage.module.css";

type OperationView = "approvals" | "submissions" | "payouts" | "refunds";

type Bounty = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  custom_type?: string | null;
  status: string;
  reward_amount?: number | string | null;
  escrow_tx_hash?: string | null;
  refund_tx_hash?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  poster?: UserProfile | null;
  submissions?: Submission[];
};

type UserProfile = {
  id: string;
  stake_address?: string | null;
  display_name?: string | null;
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
  submitted_at?: string | null;
  transaction_hash?: string | null;
  bounties?: Bounty | Bounty[] | null;
  bounty?: Bounty;
};

type DashboardResponse = {
  queues: {
    bounty_reviews?: Bounty[];
    pending_submissions?: Submission[];
    approved_payouts?: Submission[];
    refund_candidates?: Bounty[];
  };
  error?: string;
};

type QueueItem =
  | { id: string; kind: "bounty"; bounty: Bounty }
  | { id: string; kind: "submission"; submission: Submission };

const viewCopy: Record<OperationView, { label: string; emptyTitle: string; emptyText: string }> = {
  approvals: {
    label: "Bounty approvals",
    emptyTitle: "No bounty approvals",
    emptyText: "Escrow-funded bounties waiting for admin approval will appear here.",
  },
  submissions: {
    label: "Submission approvals",
    emptyTitle: "No submission approvals",
    emptyText: "Poster-reviewed submissions waiting for final admin review will appear here.",
  },
  payouts: {
    label: "Payouts",
    emptyTitle: "No queued payouts",
    emptyText: "Admin-approved submissions waiting for payout recording will appear here.",
  },
  refunds: {
    label: "Refunds",
    emptyTitle: "No refund candidates",
    emptyText: "Rejected, cancelled, or expired funded bounties that require refund handling will appear here.",
  },
};

function formatAda(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(amount)} ADA`;
}

function normalizeStatus(value: string | null | undefined) {
  if (!value) return "Pending";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortId(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getSubmissionBounty(submission: Submission) {
  if (submission.bounty) return submission.bounty;
  if (Array.isArray(submission.bounties)) return submission.bounties[0];
  return submission.bounties || null;
}

function getBountyPoster(bounty: Bounty) {
  return bounty.poster?.display_name || shortId(bounty.poster?.stake_address || bounty.created_by);
}

function getItems(view: OperationView, data: DashboardResponse | null): QueueItem[] {
  if (view === "approvals") {
    return (data?.queues.bounty_reviews || []).map((bounty) => ({ id: bounty.id, kind: "bounty", bounty }));
  }

  if (view === "submissions") {
    return (data?.queues.pending_submissions || []).map((submission) => ({
      id: submission.id,
      kind: "submission",
      submission,
    }));
  }

  if (view === "payouts") {
    return (data?.queues.approved_payouts || []).map((submission) => ({
      id: submission.id,
      kind: "submission",
      submission,
    }));
  }

  return (data?.queues.refund_candidates || []).map((bounty) => ({ id: bounty.id, kind: "bounty", bounty }));
}

export function AdminOperationQueuePage({ view }: { view: OperationView }) {
  const toast = useToast();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [actionId, setActionId] = useState("");
  const [note, setNote] = useState("");
  const [txHash, setTxHash] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/dashboard/admin", { headers: { Accept: "application/json" } });
      const payload = (await response.json()) as DashboardResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load queue.");
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load queue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const items = useMemo(() => getItems(view, data), [data, view]);
  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId]);
  const copy = viewCopy[view];

  async function runAction(id: string, action: () => Promise<Response>, successMessage: string) {
    setActionId(id);
    try {
      const response = await action();
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Action failed.");
      }

      toast.success("Dashboard updated", successMessage);
      setNote("");
      setTxHash("");
      await loadDashboard();
    } catch (err) {
      toast.error("Action failed", err instanceof Error ? err.message : "Unable to complete action.");
    } finally {
      setActionId("");
    }
  }

  if (isLoading) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyState}>
          <h2>Loading {copy.label.toLowerCase()}</h2>
          <p>Fetching the latest operation queue.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyState}>
          <h2>Could not load queue</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadDashboard()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.adminWorkspace}>
      <div className={styles.reviewWorkspace}>
        <aside className={styles.reviewListPane}>
          <div className={styles.listPaneHeader}>
            <span>{copy.label}</span>
            <strong>{items.length}</strong>
          </div>

          {items.length > 0 ? (
            <div className={styles.reviewList}>
              {items.map((item) => {
                const bounty = item.kind === "bounty" ? item.bounty : getSubmissionBounty(item.submission);
                return (
                  <button
                    className={selectedItem?.id === item.id ? styles.selectedReviewRow : undefined}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <strong>{bounty?.title || "Unlinked bounty"}</strong>
                    <span>{formatAda(bounty?.reward_amount)} - {normalizeStatus(item.kind === "bounty" ? item.bounty.status : item.submission.status)}</span>
                    <small>
                      {item.kind === "bounty"
                        ? `${getBountyPoster(item.bounty)} - ${formatRelativeTime(item.bounty.created_at)}`
                        : `${shortId(item.submission.contributor_id)} - ${formatRelativeTime(item.submission.submitted_at)}`}
                    </small>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>{copy.emptyTitle}</h2>
              <p>{copy.emptyText}</p>
            </div>
          )}
        </aside>

        <section className={styles.reviewDetailPane}>
          {selectedItem ? (
            <OperationDetail
              actionId={actionId}
              item={selectedItem}
              note={note}
              runAction={runAction}
              setNote={setNote}
              setTxHash={setTxHash}
              txHash={txHash}
              view={view}
            />
          ) : (
            <div className={styles.detailEmptyState}>
              <h2>Select an item</h2>
              <p>Choose a queue item from the left pane to review details and actions.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function OperationDetail({
  actionId,
  item,
  note,
  runAction,
  setNote,
  setTxHash,
  txHash,
  view,
}: {
  actionId: string;
  item: QueueItem;
  note: string;
  runAction: (id: string, action: () => Promise<Response>, successMessage: string) => Promise<void>;
  setNote: (value: string) => void;
  setTxHash: (value: string) => void;
  txHash: string;
  view: OperationView;
}) {
  const bounty = item.kind === "bounty" ? item.bounty : getSubmissionBounty(item.submission);

  return (
    <div className={styles.detailStack}>
      <section className={styles.detailSection}>
        <div className={styles.detailTitleRow}>
          <div>
            <span>{normalizeStatus(item.kind === "bounty" ? item.bounty.status : item.submission.status)}</span>
            <h2>{bounty?.title || "Unlinked bounty"}</h2>
          </div>
          <strong>{formatAda(bounty?.reward_amount)}</strong>
        </div>
        <p>{bounty?.custom_type || bounty?.type || "General"} - {item.kind === "bounty" ? getBountyPoster(item.bounty) : shortId(item.submission.contributor_id)}</p>
        {bounty?.escrow_tx_hash ? (
          <a href={`https://preprod.cardanoscan.io/transaction/${bounty.escrow_tx_hash}`} rel="noreferrer" target="_blank">
            Escrow {shortId(bounty.escrow_tx_hash)}
          </a>
        ) : null}
      </section>

      <section className={styles.detailSection}>
        <span>{item.kind === "submission" ? "Submission content" : "Bounty description"}</span>
        <p>{item.kind === "submission" ? item.submission.content || "No submission content provided." : bounty?.description || "No description provided."}</p>
      </section>

      {item.kind === "submission" ? (
        <section className={styles.noticeSection}>
          <span>Poster review</span>
          <p>{item.submission.poster_feedback || normalizeStatus(item.submission.poster_review_status)}</p>
        </section>
      ) : null}

      {view === "submissions" ? (
        <section className={styles.detailSection}>
          <label htmlFor="admin-note">Admin note</label>
          <textarea
            id="admin-note"
            placeholder="Add an internal note for this review."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </section>
      ) : null}

      {view === "payouts" || view === "refunds" ? (
        <section className={styles.detailSection}>
          <label htmlFor="tx-hash">{view === "payouts" ? "Payout transaction hash" : "Refund transaction hash"}</label>
          <input
            id="tx-hash"
            placeholder="64 character Cardano transaction hash"
            value={txHash}
            onChange={(event) => setTxHash(event.target.value)}
          />
        </section>
      ) : null}

      <div className={styles.detailActionBar}>
        {view === "approvals" && item.kind === "bounty" ? (
          <>
            <button
              type="button"
              disabled={actionId === `${item.id}:reject`}
              onClick={() =>
                void runAction(
                  `${item.id}:reject`,
                  () =>
                    authFetch(`/api/bounties/${item.bounty.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "rejected" }),
                    }),
                  "Bounty rejected.",
                )
              }
            >
              Reject
            </button>
            <button type="button">Message poster</button>
            <button
              type="button"
              disabled={actionId === `${item.id}:approve`}
              onClick={() =>
                void runAction(
                  `${item.id}:approve`,
                  () =>
                    authFetch(`/api/bounties/${item.bounty.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "open" }),
                    }),
                  "Bounty approved and opened.",
                )
              }
            >
              Approve
            </button>
          </>
        ) : null}

        {view === "submissions" && item.kind === "submission" ? (
          <>
            <button
              type="button"
              disabled={actionId === `${item.id}:reject`}
              onClick={() =>
                void runAction(
                  `${item.id}:reject`,
                  () =>
                    authFetch(`/api/submissions/${item.submission.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "rejected", feedback: note }),
                    }),
                  "Submission rejected.",
                )
              }
            >
              Reject
            </button>
            <button type="button">Dispute</button>
            <button
              type="button"
              disabled={actionId === `${item.id}:approve`}
              onClick={() =>
                void runAction(
                  `${item.id}:approve`,
                  () =>
                    authFetch(`/api/submissions/${item.submission.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "approved", feedback: note }),
                    }),
                  "Submission approved for payout.",
                )
              }
            >
              Approve
            </button>
          </>
        ) : null}

        {view === "payouts" && item.kind === "submission" ? (
          <>
            <button type="button">Hold</button>
            <button type="button">Open bounty</button>
            <button
              type="button"
              disabled={actionId === `${item.id}:payout`}
              onClick={() =>
                void runAction(
                  `${item.id}:payout`,
                  () =>
                    authFetch("/api/admin/release-payment", {
                      method: "POST",
                      body: JSON.stringify({ submission_id: item.submission.id, transaction_hash: txHash }),
                    }),
                  "Payout transaction recorded.",
                )
              }
            >
              Record payout
            </button>
          </>
        ) : null}

        {view === "refunds" && item.kind === "bounty" ? (
          <>
            <button type="button">Hold</button>
            <button type="button">Open bounty</button>
            <button
              type="button"
              disabled={actionId === `${item.id}:refund`}
              onClick={() =>
                void runAction(
                  `${item.id}:refund`,
                  () =>
                    authFetch("/api/admin/refund", {
                      method: "POST",
                      body: JSON.stringify({ bounty_id: item.bounty.id, transaction_hash: txHash }),
                    }),
                  "Refund transaction recorded.",
                )
              }
            >
              Record refund
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
