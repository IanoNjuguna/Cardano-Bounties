"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./DashboardPage.module.css";

type Role = "admin" | "contributor" | "poster";

type NavItem = {
  label: string;
  href: string;
  badge?: string;
};

type Metric = {
  label: string;
  value: string;
  detail: string;
};

type QueueItem = {
  title: string;
  meta: string;
  status: string;
  value: string;
};

type Activity = {
  item: string;
  owner: string;
  status: string;
  updated: string;
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  contributor: "Contributor",
  poster: "Poster",
};

const dashboardData: Record<
  Role,
  {
    eyebrow: string;
    title: string;
    intro: string;
    nav: NavItem[];
    metrics: Metric[];
    queueTitle: string;
    queue: QueueItem[];
    activityTitle: string;
    activity: Activity[];
  }
> = {
  admin: {
    eyebrow: "Platform operations",
    title: "Admin command center",
    intro:
      "Review bounty health, submission throughput, pending payouts, and project activity from one operational surface.",
    nav: [
      { label: "Overview", href: "/dashboard" },
      { label: "Bounties", href: "/dashboard/bounties", badge: "12" },
      { label: "Submissions", href: "/dashboard/submissions", badge: "8" },
      { label: "Projects", href: "/dashboard/projects" },
      { label: "Payouts", href: "/dashboard/payouts", badge: "3" },
      { label: "Users", href: "/dashboard/users" },
      { label: "Settings", href: "/dashboard/settings" },
    ],
    metrics: [
      { label: "Open bounties", value: "24", detail: "+6 this week" },
      { label: "Pending reviews", value: "18", detail: "7 high priority" },
      { label: "Queued payouts", value: "9,840 ADA", detail: "3 awaiting tx" },
      { label: "Active projects", value: "11", detail: "4 posted recently" },
    ],
    queueTitle: "Admin review queue",
    queue: [
      { title: "Approve wallet SDK bounty", meta: "Lace integration · 2 submissions", status: "Review", value: "1,800 ADA" },
      { title: "Process approved documentation payout", meta: "Technical docs · Tx required", status: "Payout", value: "650 ADA" },
      { title: "Moderate security audit brief", meta: "Project owner requested edits", status: "Needs edit", value: "4,000 ADA" },
    ],
    activityTitle: "Recent platform activity",
    activity: [
      { item: "Plutus V3 starter bounty", owner: "Gimbalabs", status: "Open", updated: "12 min ago" },
      { item: "DEX landing page review", owner: "TechKR", status: "Approved", updated: "41 min ago" },
      { item: "Research translation sprint", owner: "Community", status: "Draft", updated: "2 hr ago" },
      { item: "Wallet UX audit", owner: "Design Guild", status: "Paid", updated: "Yesterday" },
    ],
  },
  contributor: {
    eyebrow: "Contributor workspace",
    title: "Track your bounty work",
    intro:
      "Find next steps, watch deadlines, monitor submitted work, and keep your contribution history organized.",
    nav: [
      { label: "Overview", href: "/dashboard" },
      { label: "Available bounties", href: "/explore", badge: "24" },
      { label: "My submissions", href: "/dashboard/submissions", badge: "4" },
      { label: "Saved bounties", href: "/dashboard/saved" },
      { label: "Earnings", href: "/dashboard/earnings" },
      { label: "Profile", href: "/dashboard/profile" },
    ],
    metrics: [
      { label: "Active submissions", value: "4", detail: "2 in review" },
      { label: "Earned rewards", value: "2,450 ADA", detail: "Last paid May 8" },
      { label: "Saved bounties", value: "9", detail: "3 closing soon" },
      { label: "Approval rate", value: "86%", detail: "Past 30 days" },
    ],
    queueTitle: "Contributor next steps",
    queue: [
      { title: "Finish Plutus starter guide", meta: "Content · Draft saved", status: "Due soon", value: "800 ADA" },
      { title: "Respond to UI audit feedback", meta: "Design · Reviewer comments", status: "Action needed", value: "1,200 ADA" },
      { title: "Submit SDK test coverage notes", meta: "Development · Ready to submit", status: "Ready", value: "950 ADA" },
    ],
    activityTitle: "Submission history",
    activity: [
      { item: "Wallet onboarding copy", owner: "You", status: "Approved", updated: "Today" },
      { item: "Protocol FAQ rewrite", owner: "You", status: "In review", updated: "Yesterday" },
      { item: "DRep explainer graphic", owner: "You", status: "Changes requested", updated: "May 9" },
      { item: "Node setup guide", owner: "You", status: "Paid", updated: "May 4" },
    ],
  },
  poster: {
    eyebrow: "Project workspace",
    title: "Manage posted bounties",
    intro:
      "Create bounty briefs, review incoming submissions, coordinate feedback, and track reward commitments.",
    nav: [
      { label: "Overview", href: "/dashboard" },
      { label: "My bounties", href: "/dashboard/bounties", badge: "7" },
      { label: "Create bounty", href: "/dashboard/bounties/new" },
      { label: "Submissions", href: "/dashboard/submissions", badge: "15" },
      { label: "Project profile", href: "/dashboard/project" },
      { label: "Billing", href: "/dashboard/billing" },
    ],
    metrics: [
      { label: "Live bounties", value: "7", detail: "3 featured" },
      { label: "Incoming submissions", value: "15", detail: "5 unread" },
      { label: "Committed rewards", value: "12,300 ADA", detail: "Across live work" },
      { label: "Avg. response time", value: "18h", detail: "This month" },
    ],
    queueTitle: "Poster action queue",
    queue: [
      { title: "Review security audit submissions", meta: "3 contributors waiting", status: "Review", value: "5,000 ADA" },
      { title: "Publish design bounty brief", meta: "Draft · Missing acceptance criteria", status: "Draft", value: "1,100 ADA" },
      { title: "Send feedback on docs submission", meta: "Contributor requested clarification", status: "Feedback", value: "700 ADA" },
    ],
    activityTitle: "Bounty performance",
    activity: [
      { item: "Smart contract audit", owner: "Your project", status: "15 applicants", updated: "Today" },
      { item: "Landing page UX review", owner: "Your project", status: "4 submissions", updated: "Yesterday" },
      { item: "Developer docs rewrite", owner: "Your project", status: "Open", updated: "May 10" },
      { item: "Community onboarding kit", owner: "Your project", status: "Completed", updated: "May 6" },
    ],
  },
};

export function DashboardPage() {
  const [role, setRole] = useState<Role>("admin");
  const data = dashboardData[role];

  const completion = useMemo(() => {
    if (role === "admin") return 72;
    if (role === "contributor") return 64;
    return 81;
  }, [role]);

  return (
    <main className={styles.dashboardShell}>
      <aside className={styles.sidebar} aria-label="Dashboard navigation">
        <Link className={styles.brand} href="/">
          <Image src="/cardano_bounties_logo.png" alt="Cardano Bounties" width={158} height={62} priority />
        </Link>

        <div className={styles.roleCard}>
          <span>{roleLabels[role]}</span>
          <strong>{data.eyebrow}</strong>
        </div>

        <nav className={styles.sideNav}>
          {data.nav.map((item) => (
            <Link href={item.href} key={item.label} className={item.label === "Overview" ? styles.activeNav : ""}>
              <span>{item.label}</span>
              {item.badge ? <b>{item.badge}</b> : null}
            </Link>
          ))}
        </nav>

        <Link className={styles.backLink} href="/explore">
          Explore public bounties
        </Link>
      </aside>

      <section className={styles.dashboardMain}>
        <header className={styles.topbar}>
          <div>
            <span className="pill">{data.eyebrow}</span>
            <h1>{data.title}</h1>
            <p>{data.intro}</p>
          </div>

          <div className={styles.roleSwitch} aria-label="Preview dashboard role">
            {(Object.keys(roleLabels) as Role[]).map((item) => (
              <button
                className={role === item ? styles.selectedRole : ""}
                key={item}
                type="button"
                onClick={() => setRole(item)}
              >
                {roleLabels[item]}
              </button>
            ))}
          </div>
        </header>

        <section className={styles.metricGrid} aria-label={`${roleLabels[role]} dashboard metrics`}>
          {data.metrics.map((metric) => (
            <article className={styles.metricCard} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className={styles.workspaceGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span>Queue</span>
                <h2>{data.queueTitle}</h2>
              </div>
              <button type="button">View all</button>
            </div>

            <div className={styles.queueList}>
              {data.queue.map((item) => (
                <article className={styles.queueItem} key={item.title}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.meta}</p>
                  </div>
                  <span>{item.status}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </div>

          <aside className={styles.healthPanel}>
            <span>Operational health</span>
            <strong>{completion}%</strong>
            <div className={styles.progressTrack} aria-hidden="true">
              <i style={{ width: `${completion}%` }} />
            </div>
            <p>
              {role === "admin"
                ? "Review volume is healthy, with payout operations needing the most attention."
                : role === "contributor"
                  ? "Your active work is on track. Prioritize feedback responses before claiming new work."
                  : "Your bounty pipeline is moving well. Submission review speed is the biggest leverage point."}
            </p>
          </aside>
        </section>

        <section className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Activity</span>
              <h2>{data.activityTitle}</h2>
            </div>
            <Link href="/dashboard/activity">Open activity</Link>
          </div>

          <div className={styles.activityTable} role="table" aria-label={data.activityTitle}>
            <div className={styles.tableHead} role="row">
              <span role="columnheader">Item</span>
              <span role="columnheader">Owner</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Updated</span>
            </div>
            {data.activity.map((item) => (
              <div className={styles.tableRow} role="row" key={`${item.item}-${item.updated}`}>
                <span role="cell">{item.item}</span>
                <span role="cell">{item.owner}</span>
                <span role="cell">
                  <b>{item.status}</b>
                </span>
                <span role="cell">{item.updated}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
