"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { useAppWallet } from "@/components/wallet/WalletProvider";
import { authFetch } from "@/lib/api";
import styles from "@/app/pages/DashboardPage.module.css";

type DashboardCounts = {
  metrics?: Record<string, number>;
  error?: string;
};

const pageMeta: Record<string, { eyebrow: string; title: string; description: string; action: string; href: string }> = {
  "/dashboard": {
    eyebrow: "Admin operations",
    title: "Operations workspace",
    description: "Process bounty approvals, submission reviews, payouts, refunds, and treasury exposure.",
    action: "Open bounties",
    href: "/dashboard/bounties",
  },
  "/dashboard/approvals": {
    eyebrow: "Review",
    title: "Bounty approvals",
    description: "Review escrow-funded bounty posts before they go live on the public board.",
    action: "Submissions",
    href: "/dashboard/submissions",
  },
  "/dashboard/submissions": {
    eyebrow: "Review",
    title: "Submission approvals",
    description: "Run final admin review on poster-approved bounty submissions.",
    action: "Payouts",
    href: "/dashboard/payouts",
  },
  "/dashboard/bounties": {
    eyebrow: "Manage",
    title: "All bounties",
    description: "Browse bounty status, reward value, poster identity, deadlines, and submission volume.",
    action: "Workspace",
    href: "/dashboard",
  },
  "/dashboard/posters": {
    eyebrow: "Manage",
    title: "Posters",
    description: "Review bounty creators by wallet, posting volume, approval rate, and active bounty count.",
    action: "Workspace",
    href: "/dashboard",
  },
  "/dashboard/hunters": {
    eyebrow: "Manage",
    title: "Hunters",
    description: "Track contributor submission volume, accepted work, earned ADA, and recent activity.",
    action: "Workspace",
    href: "/dashboard",
  },
  "/dashboard/payouts": {
    eyebrow: "Treasury ops",
    title: "Payouts",
    description: "Review approved submissions that need payout transaction handling.",
    action: "Treasury",
    href: "/dashboard/treasury",
  },
  "/dashboard/refunds": {
    eyebrow: "Treasury ops",
    title: "Refunds",
    description: "Track rejected, cancelled, or expired funded bounties that need refund handling.",
    action: "Treasury",
    href: "/dashboard/treasury",
  },
  "/dashboard/disputes": {
    eyebrow: "Manage",
    title: "Disputes",
    description: "Review dispute records once dispute intake is connected.",
    action: "Workspace",
    href: "/dashboard",
  },
  "/dashboard/treasury": {
    eyebrow: "System",
    title: "Treasury",
    description: "Monitor committed bounty funds, queued payout value, and refund exposure.",
    action: "Payouts",
    href: "/dashboard/payouts",
  },
  "/dashboard/settings": {
    eyebrow: "Account settings",
    title: "Profile settings",
    description: "Customize your display name and bio details linked to your Cardano stake key.",
    action: "Overview",
    href: "/dashboard",
  },
};

function shortId(value: string | null | undefined) {
  if (!value) return "Unknown";
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function getNavGroups(metrics: Record<string, number>, role: string) {
  if (role === "admin") {
    return [
      { label: "Overview", items: [{ href: "/dashboard", label: "Operations", count: 0 }] },
      {
        label: "Review",
        items: [
          { href: "/dashboard/approvals", label: "Approvals", count: metrics.awaiting_bounty_reviews || 0 },
          { href: "/dashboard/submissions", label: "Submissions", count: metrics.pending_submissions || 0 },
          { href: "/dashboard/payouts", label: "Payouts", count: metrics.approved_payouts || 0 },
          { href: "/dashboard/refunds", label: "Refunds", count: metrics.refund_candidates || 0 },
        ],
      },
      {
        label: "Manage",
        items: [
          { href: "/dashboard/bounties", label: "Bounties", count: 0 },
          { href: "/dashboard/posters", label: "Posters", count: 0 },
          { href: "/dashboard/hunters", label: "Hunters", count: 0 },
          { href: "/dashboard/disputes", label: "Disputes", count: 0 },
        ],
      },
      { label: "System", items: [{ href: "/dashboard/treasury", label: "Treasury", count: 0 }] },
    ];
  } else {
    return [
      {
        label: "Workspace",
        items: [
          { href: "/dashboard", label: "Overview", count: 0 },
          { href: "/post-bounty", label: "Post bounty", count: 0 },
          { href: "/explore", label: "Explore", count: 0 },
          { href: "/dashboard/settings", label: "Profile Settings", count: 0 },
        ],
      },
    ];
  }
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { connected, disconnectWallet, isAuthenticated, reauthenticate, role, stakeAddress } = useAppWallet();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const isDashboardHome = pathname === "/dashboard";

  const loadCounts = useCallback(async () => {
    if (!isAuthenticated || role !== "admin") return;
    setIsLoadingCounts(true);
    try {
      const response = await authFetch("/api/dashboard/admin", { headers: { Accept: "application/json" } });
      const payload = (await response.json()) as DashboardCounts;
      if (response.ok) setCounts(payload);
    } finally {
      setIsLoadingCounts(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadCounts();
    }, 0);

    if (!isAuthenticated || role !== "admin") {
      return () => window.clearTimeout(initialTimer);
    }

    const timer = window.setInterval(() => {
      void loadCounts();
    }, 120_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, loadCounts, role]);

  const navGroups = useMemo(() => getNavGroups(counts?.metrics || {}, role || ""), [counts, role]);
  const meta = pageMeta[pathname] || pageMeta["/dashboard"];

  if (isDashboardHome && role !== "admin") {
    return children;
  }

  return (
    <main className={styles.dashboardShell}>
      <aside className={styles.sidebar} aria-label="Dashboard navigation">
        <Link className={styles.brand} href="/">
          <Image src="/cardano_bounties_logo.png" alt="Cardano Bounties" width={158} height={62} priority />
        </Link>

        <div className={styles.roleCard}>
          <span>{role === "admin" ? "Admin" : "Poster"}</span>
          <strong>{role === "admin" ? (isLoadingCounts ? "Syncing operations" : "Platform operations") : "Project workspace"}</strong>
        </div>

        <nav className={styles.sideNav} aria-label="Dashboard sections">
          {navGroups.map((group) => (
            <section className={styles.navGroup} key={group.label}>
              <span>{group.label}</span>
              {group.items.map((item) => (
                <Link
                  href={item.href}
                  className={pathname === item.href ? styles.activeNav : undefined}
                  key={`${group.label}-${item.label}`}
                >
                  {item.label}
                  {item.count > 0 ? <b>{item.count}</b> : null}
                </Link>
              ))}
            </section>
          ))}
        </nav>

        <div className={styles.walletSlot}>
          {connected ? (
            <div className={styles.shellWallet}>
              <span>Connected wallet</span>
              <strong>{shortId(stakeAddress)}</strong>
              <button type="button" onClick={disconnectWallet}>Disconnect</button>
            </div>
          ) : (
            <WalletConnect />
          )}
        </div>
      </aside>

      <section className={styles.dashboardMain}>
        <header className={styles.topbar}>
          <div>
            <span className="pill">{meta.eyebrow}</span>
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
          </div>
          <div className={styles.topbarControls} aria-label="Dashboard controls">
            <label>
              <span>Search</span>
              <input type="search" placeholder="Search dashboard" />
            </label>
            <label>
              <span>Filter</span>
              <select defaultValue="all">
                <option value="all">All queues</option>
                <option value="attention">Needs attention</option>
                <option value="funded">Funded</option>
              </select>
            </label>
            <label>
              <span>Date range</span>
              <select defaultValue="30d">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </label>
            <Link href={meta.href}>{meta.action}</Link>
          </div>
        </header>

        {!connected ? (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <h2>Connect wallet to view dashboard</h2>
              <p>Dashboard operations require a connected wallet.</p>
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
        ) : (role !== "admin" && pathname !== "/dashboard/settings") ? (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <h2>Admin access required</h2>
              <p>This dashboard workspace is only available to admin wallets.</p>
            </div>
          </section>
        ) : (
          children
        )}
      </section>
    </main>
  );
}
