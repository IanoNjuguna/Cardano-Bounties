"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/api";
import styles from "./DashboardPage.module.css";

type View = "bounties" | "posters" | "hunters" | "payouts" | "disputes" | "treasury";

type Bounty = {
  id: string;
  title: string;
  type?: string | null;
  custom_type?: string | null;
  status: string;
  reward_amount?: number | string | null;
  created_by?: string | null;
  deadline?: string | null;
  created_at?: string | null;
  poster?: UserProfile | null;
  submissions?: Submission[];
};

type Submission = {
  id: string;
  contributor_id?: string | null;
  status: string;
  submitted_at?: string | null;
  paid_at?: string | null;
  transaction_hash?: string | null;
  bounties?: Bounty | Bounty[] | null;
  bounty?: Bounty;
};

type UserProfile = {
  id: string;
  stake_address?: string | null;
  display_name?: string | null;
};

type DashboardResponse = {
  metrics: Record<string, number>;
  queues: {
    bounties?: Bounty[];
    pending_submissions?: Submission[];
    approved_payouts?: Submission[];
    refund_candidates?: Bounty[];
  };
  error?: string;
};

type TableRow = Record<string, string | number>;

const viewTitles: Record<View, { title: string; eyebrow: string; description: string }> = {
  bounties: {
    eyebrow: "Manage",
    title: "All bounties",
    description: "Browse bounty status, reward value, poster identity, deadlines, and submission volume.",
  },
  posters: {
    eyebrow: "Manage",
    title: "Posters",
    description: "Review bounty creators by wallet, posting volume, approval rate, and active bounty count.",
  },
  hunters: {
    eyebrow: "Manage",
    title: "Hunters",
    description: "Track contributor submission volume, accepted work, earned ADA, and recent activity.",
  },
  payouts: {
    eyebrow: "Review",
    title: "Payouts",
    description: "Monitor approved submissions waiting for payout and completed payout transaction records.",
  },
  disputes: {
    eyebrow: "Manage",
    title: "Disputes",
    description: "Review open disputes once dispute intake is connected to the platform workflow.",
  },
  treasury: {
    eyebrow: "System",
    title: "Treasury",
    description: "Monitor committed bounty funds, queued payout value, and refund exposure.",
  },
};

const columns: Record<View, string[]> = {
  bounties: ["Title", "Category", "Reward", "Submissions", "Status", "Poster", "Deadline"],
  posters: ["Wallet", "Total bounties", "Total ADA posted", "Approval rate", "Active bounties", "Joined"],
  hunters: ["Wallet", "Total submissions", "Accepted", "ADA earned", "Active submissions", "Last active"],
  payouts: ["Hunter wallet", "Bounty title", "ADA amount", "Status", "Tx hash", "Queued at", "Confirmed at"],
  disputes: ["ID", "Bounty", "Raised by", "Reason", "Status", "Opened at"],
  treasury: ["Metric", "Value", "Status", "Notes"],
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
    year: "numeric",
  }).format(date);
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

function getSubmissionBounty(submission: Submission) {
  if (submission.bounty) return submission.bounty;
  if (Array.isArray(submission.bounties)) return submission.bounties[0];
  return submission.bounties || null;
}

function buildRows(view: View, data: DashboardResponse | null): TableRow[] {
  const bounties = data?.queues.bounties || [];
  const pendingSubmissions = data?.queues.pending_submissions || [];
  const approvedPayouts = data?.queues.approved_payouts || [];
  const allSubmissions = [
    ...pendingSubmissions,
    ...approvedPayouts,
    ...bounties.flatMap((bounty) => bounty.submissions || []),
  ];

  if (view === "bounties") {
    return bounties.map((bounty) => ({
      Title: bounty.title,
      Category: bounty.custom_type || bounty.type || "General",
      Reward: formatAda(bounty.reward_amount),
      Submissions: bounty.submissions?.length || 0,
      Status: normalizeStatus(bounty.status),
      Poster: bounty.poster?.display_name || shortId(bounty.poster?.stake_address || bounty.created_by),
      Deadline: formatDate(bounty.deadline),
    }));
  }

  if (view === "posters") {
    const posters = new Map<string, { wallet: string; bounties: Bounty[] }>();
    bounties.forEach((bounty) => {
      const key = bounty.created_by || bounty.poster?.stake_address || "unknown";
      const existing = posters.get(key) || { wallet: bounty.poster?.stake_address || key, bounties: [] };
      existing.bounties.push(bounty);
      posters.set(key, existing);
    });

    return [...posters.values()].map((poster) => {
      const approved = poster.bounties.filter((bounty) => ["open", "completed"].includes(bounty.status)).length;
      return {
        Wallet: shortId(poster.wallet),
        "Total bounties": poster.bounties.length,
        "Total ADA posted": formatAda(poster.bounties.reduce((sum, bounty) => sum + Number(bounty.reward_amount || 0), 0)),
        "Approval rate": `${Math.round((approved / Math.max(poster.bounties.length, 1)) * 100)}%`,
        "Active bounties": poster.bounties.filter((bounty) => bounty.status === "open").length,
        Joined: formatDate(poster.bounties.at(-1)?.created_at),
      };
    });
  }

  if (view === "hunters") {
    const hunters = new Map<string, Submission[]>();
    allSubmissions.forEach((submission) => {
      const key = submission.contributor_id || "unknown";
      hunters.set(key, [...(hunters.get(key) || []), submission]);
    });

    return [...hunters.entries()].map(([wallet, submissions]) => {
      const accepted = submissions.filter((submission) => ["approved", "paid"].includes(submission.status));
      const earned = accepted.reduce((sum, submission) => sum + Number(getSubmissionBounty(submission)?.reward_amount || 0), 0);
      const lastActive = submissions
        .map((submission) => submission.submitted_at)
        .filter(Boolean)
        .sort()
        .at(-1);

      return {
        Wallet: shortId(wallet),
        "Total submissions": submissions.length,
        Accepted: accepted.length,
        "ADA earned": formatAda(earned),
        "Active submissions": submissions.filter((submission) => submission.status === "pending").length,
        "Last active": formatDate(lastActive),
      };
    });
  }

  if (view === "payouts") {
    return approvedPayouts.map((submission) => {
      const bounty = getSubmissionBounty(submission);
      return {
        "Hunter wallet": shortId(submission.contributor_id),
        "Bounty title": bounty?.title || "Unlinked bounty",
        "ADA amount": formatAda(bounty?.reward_amount),
        Status: normalizeStatus(submission.status),
        "Tx hash": shortId(submission.transaction_hash),
        "Queued at": formatDate(submission.submitted_at),
        "Confirmed at": formatDate(submission.paid_at),
      };
    });
  }

  if (view === "treasury") {
    const openBountyValue = bounties
      .filter((bounty) => bounty.status === "open")
      .reduce((sum, bounty) => sum + Number(bounty.reward_amount || 0), 0);
    const queuedPayoutValue = approvedPayouts.reduce(
      (sum, submission) => sum + Number(getSubmissionBounty(submission)?.reward_amount || 0),
      0,
    );
    const refundExposure = (data?.queues.refund_candidates || []).reduce(
      (sum, bounty) => sum + Number(bounty.reward_amount || 0),
      0,
    );

    return [
      {
        Metric: "Open bounty rewards",
        Value: formatAda(openBountyValue),
        Status: "Committed",
        Notes: "Total reward value across open public bounties.",
      },
      {
        Metric: "Queued payouts",
        Value: formatAda(queuedPayoutValue),
        Status: "Needs payment",
        Notes: "Approved submissions waiting for payout transaction recording.",
      },
      {
        Metric: "Refund exposure",
        Value: formatAda(refundExposure),
        Status: "Needs review",
        Notes: "Rejected, cancelled, or expired funded bounties that may require refund handling.",
      },
      {
        Metric: "Bounties awaiting admin review",
        Value: String(data?.metrics.awaiting_bounty_reviews || 0),
        Status: "Operational",
        Notes: "Funded bounties not yet public.",
      },
    ];
  }

  return [];
}

export function DashboardManagementPage({ view }: { view: View }) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/dashboard/admin", {
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as DashboardResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load management data.");
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load management data.");
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

  const rows = useMemo(() => buildRows(view, data), [data, view]);
  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [query, rows]);
  const title = viewTitles[view];

  if (isLoading) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyState}>
          <h2>Loading {title.title.toLowerCase()}</h2>
          <p>Fetching the latest admin management data.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.panel}>
        <div className={styles.emptyState}>
          <h2>Could not load data</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadDashboard()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.managementPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span>{title.eyebrow}</span>
          <h2>{title.title}</h2>
          <p>{title.description}</p>
        </div>
        <strong>{filteredRows.length} rows</strong>
      </div>

      <div className={styles.managementToolbar}>
        <label>
          <span>Search records</span>
          <input
            type="search"
            placeholder={`Search ${title.title.toLowerCase()}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <ManagementTable columns={columns[view]} rows={filteredRows} view={view} />
    </section>
  );
}

function ManagementTable({ columns: tableColumns, rows, view }: { columns: string[]; rows: TableRow[]; view: View }) {
  if (rows.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>{view === "disputes" ? "No disputes yet" : "No matching records"}</h2>
        <p>
          {view === "disputes"
            ? "Dispute records will appear here after dispute intake is added."
            : "Try a broader search or wait for more platform activity."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.managementTableWrap}>
      <table className={styles.managementTable}>
        <thead>
          <tr>
            {tableColumns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${view}-${index}`}>
              {tableColumns.map((column) => (
                <td data-label={column} key={column}>
                  {row[column] ?? "-"}
                </td>
              ))}
              <td data-label="Actions">
                <button type="button">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
