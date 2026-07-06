"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { authFetch } from "@/lib/api";
import styles from "./AdminQueue.module.css";

type Bounty = {
  id: string;
  title: string;
  reward_amount?: number | string | null;
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
  contributor?: UserProfile | null;
  bounties?: Bounty | Bounty[] | null;
  bounty?: Bounty;
};

type DashboardResponse = {
  queues: {
    pending_submissions?: Submission[];
  };
  error?: string;
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

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
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

function getSubmitterHandle(submission: Submission) {
  return submission.contributor?.display_name || shortId(submission.contributor?.stake_address || submission.contributor_id);
}

export function AdminSubmissionsPage() {
  const toast = useToast();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "approved" | "rejected"
  const [search, setSearch] = useState("");
  
  const [sortCol, setSortCol] = useState<"submitter" | "amount" | "status" | "submitted">("submitted");
  const [sortDesc, setSortDesc] = useState(true);
  
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/dashboard/admin", { headers: { Accept: "application/json" } });
      const payload = (await response.json()) as DashboardResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load submissions.");
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load submissions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const items = useMemo(() => {
    let list = data?.queues.pending_submissions || [];
    
    if (filter !== "all") {
      list = list.filter((s) => s.status.toLowerCase() === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const handle = getSubmitterHandle(s).toLowerCase();
        const bountyTitle = getSubmissionBounty(s)?.title.toLowerCase() || "";
        return handle.includes(q) || bountyTitle.includes(q);
      });
    }
    
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "submitter":
          cmp = getSubmitterHandle(a).localeCompare(getSubmitterHandle(b));
          break;
        case "amount":
          const aAmount = Number(getSubmissionBounty(a)?.reward_amount || 0);
          const bAmount = Number(getSubmissionBounty(b)?.reward_amount || 0);
          cmp = aAmount - bAmount;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "submitted":
          const aDate = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
          const bDate = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
          cmp = aDate - bDate;
          break;
      }
      return sortDesc ? -cmp : cmp;
    });

    return list;
  }, [data, filter, search, sortCol, sortDesc]);

  const selectedItem = useMemo(() => items.find((s) => s.id === selectedSubmissionId) || null, [items, selectedSubmissionId]);
  const selectedIndex = items.findIndex((s) => s.id === selectedSubmissionId);
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex !== -1 && selectedIndex < items.length - 1;

  useEffect(() => {
    if (selectedItem) {
      setAdminNote(selectedItem.feedback || "");
    }
  }, [selectedItem]);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedSubmissionId(id);
  };

  const handleCloseModal = () => {
    setSelectedSubmissionId(null);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedSubmissionId) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedSubmissionId]);

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch (e) {
      // Ignored
    }
  };

  const runAction = async (status: "approved" | "rejected") => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const response = await authFetch(`/api/submissions/${selectedItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, feedback: adminNote }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Action failed.");
      
      toast.success("Dashboard updated", `Submission ${status}.`);
      
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        const updatedQueue = prev.queues.pending_submissions?.map(sub => 
          sub.id === selectedItem.id ? { ...sub, status, feedback: adminNote } : sub
        );
        return { ...prev, queues: { ...prev.queues, pending_submissions: updatedQueue } };
      });
      
      handleCloseModal();
    } catch (err) {
      toast.error("Action failed", err instanceof Error ? err.message : "Unable to complete action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSortIndicator = (col: typeof sortCol) => {
    if (sortCol !== col) return null;
    return sortDesc ? " ↓" : " ↑";
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.tabs} role="tablist">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={styles.tab}
              data-active={filter === f}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search submitter or bounty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter submissions"
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} role="grid" aria-label="Submissions">
          <thead>
            <tr>
              <th data-sortable="true" onClick={() => handleSort("submitter")} aria-sort={sortCol === "submitter" ? (sortDesc ? "descending" : "ascending") : "none"}>
                <div className={styles.thContent}>Submitter {renderSortIndicator("submitter")}</div>
              </th>
              <th>Bounty</th>
              <th data-sortable="true" onClick={() => handleSort("amount")} aria-sort={sortCol === "amount" ? (sortDesc ? "descending" : "ascending") : "none"}>
                <div className={`${styles.thContent} ${styles.right}`}>Amount {renderSortIndicator("amount")}</div>
              </th>
              <th data-sortable="true" onClick={() => handleSort("status")} aria-sort={sortCol === "status" ? (sortDesc ? "descending" : "ascending") : "none"}>
                <div className={styles.thContent}>Status {renderSortIndicator("status")}</div>
              </th>
              <th data-sortable="true" onClick={() => handleSort("submitted")} aria-sort={sortCol === "submitted" ? (sortDesc ? "descending" : "ascending") : "none"}>
                <div className={styles.thContent}>Submitted {renderSortIndicator("submitted")}</div>
              </th>
              <th><div className={`${styles.thContent} ${styles.right}`}>Actions</div></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} aria-hidden="true">
                  <td><div className={styles.shimmer} style={{ width: '120px' }} /></td>
                  <td><div className={styles.shimmer} style={{ width: '180px' }} /></td>
                  <td><div className={styles.shimmer} style={{ width: '80px', marginLeft: 'auto' }} /></td>
                  <td><div className={styles.shimmer} style={{ width: '60px', borderRadius: '999px' }} /></td>
                  <td><div className={styles.shimmer} style={{ width: '70px' }} /></td>
                  <td><div className={styles.shimmer} style={{ width: '24px', marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>Couldn't load submissions</h3>
                    <p>{error}</p>
                    <button type="button" className={styles.clearFilterBtn} onClick={() => void loadDashboard()}>Retry</button>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    {search || filter !== "all" ? (
                      <>
                        <h3>No matching submissions</h3>
                        <p>No submissions match your current filters.</p>
                        <button type="button" className={styles.clearFilterBtn} onClick={() => { setFilter("all"); setSearch(""); }}>Clear filters</button>
                      </>
                    ) : (
                      <>
                        <h3>No submissions yet</h3>
                        <p>There are no submissions in the queue.</p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((submission) => {
                const handle = getSubmitterHandle(submission);
                const bounty = getSubmissionBounty(submission);
                
                return (
                  <tr key={submission.id} onClick={() => handleRowClick(submission.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(submission.id); } }}>
                    <td>
                      <div className={styles.submitter}>
                        <div className={styles.avatar} aria-hidden="true">{getInitials(handle)}</div>
                        <span className={styles.handle} title={handle}>{handle}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.bountyTitle} title={bounty?.title}>{bounty?.title || "Unknown Bounty"}</span>
                    </td>
                    <td>
                      <div className={styles.amount}>{formatAda(bounty?.reward_amount)}</div>
                    </td>
                    <td>
                      <span className={styles.statusPill} data-status={submission.status.toLowerCase()}>
                        {normalizeStatus(submission.status)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.date} title={submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : undefined}>
                        {formatRelativeTime(submission.submitted_at)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" aria-label="View submission" tabIndex={-1} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div className={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <span className={styles.statusPill} data-status={selectedItem.status.toLowerCase()}>
                  {normalizeStatus(selectedItem.status)}
                </span>
                <span className={styles.modalAmount}>{formatAda(getSubmissionBounty(selectedItem)?.reward_amount)}</span>
              </div>
              <button type="button" className={styles.closeBtn} onClick={handleCloseModal} aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <h3 id="modal-title" className={styles.modalTitle}>{getSubmissionBounty(selectedItem)?.title || "Unknown Bounty"}</h3>
              
              <div className={styles.submitterInfo}>
                <div className={styles.avatar} aria-hidden="true">{getInitials(getSubmitterHandle(selectedItem))}</div>
                <span className={styles.handle} style={{ fontSize: '14px' }}>{getSubmitterHandle(selectedItem)}</span>
                
                <div className={styles.hashGroup}>
                  <span>ID: {shortId(selectedItem.id)}</span>
                  <button type="button" className={styles.copyBtn} aria-label="Copy submission hash" aria-live="polite" data-copied={copyStatus === "copied"} onClick={() => void handleCopyHash(selectedItem.id)}>
                    {copyStatus === "copied" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.contentSection}>
                <div className={styles.contentBlock}>
                  <div className={styles.contentLabel}>Link</div>
                  <div className={styles.contentValue}>
                    {selectedItem.content?.startsWith("http") ? (
                      <a href={selectedItem.content} target="_blank" rel="noopener noreferrer" className={styles.contentLink}>
                        {selectedItem.content}
                      </a>
                    ) : (
                      selectedItem.content || "No submission content provided."
                    )}
                  </div>
                </div>
                {(selectedItem.poster_feedback || selectedItem.poster_review_status) && (
                  <div className={styles.contentBlock}>
                    <div className={styles.contentLabel}>Poster Notes</div>
                    <div className={styles.contentValue}>
                      {selectedItem.poster_feedback || normalizeStatus(selectedItem.poster_review_status)}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.adminNoteSection}>
                <label className={styles.contentLabel} htmlFor="admin-note-modal">Admin Note</label>
                <textarea
                  id="admin-note-modal"
                  className={styles.adminNoteTextarea}
                  placeholder="Add an internal note for this review. Will be saved when you approve or reject."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.navControls}>
                <button type="button" className={styles.navBtn} disabled={!canGoPrev} aria-label="Previous submission" onClick={() => setSelectedSubmissionId(items[selectedIndex - 1]?.id || null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button type="button" className={styles.navBtn} disabled={!canGoNext} aria-label="Next submission" onClick={() => setSelectedSubmissionId(items[selectedIndex + 1]?.id || null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>

              {selectedItem.status.toLowerCase() !== "pending" ? (
                <div className={styles.resolutionState}>
                  {normalizeStatus(selectedItem.status)} 
                  {selectedItem.status.toLowerCase() === "approved" ? " for payout" : ""}
                </div>
              ) : (
                <>
                  <button type="button" className={styles.rejectBtn} disabled={isSubmitting} onClick={() => void runAction("rejected")}>
                    {isSubmitting ? <div className={styles.spinner} /> : "Reject"}
                  </button>
                  <button type="button" className={styles.approveBtn} disabled={isSubmitting} onClick={() => void runAction("approved")}>
                    {isSubmitting ? <div className={styles.spinner} /> : "Approve"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
