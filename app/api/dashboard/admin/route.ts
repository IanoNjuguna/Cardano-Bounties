import { NextRequest, NextResponse } from "next/server";
import { BOUNTY_STATUS, SUBMISSION_STATUS } from "@/lib/bountyContract";
import { supabaseAdmin } from "@/lib/supabase";

function sumAda(items: Array<{ reward_amount?: number | string | null }>) {
  return items.reduce((sum, item) => sum + Number(item.reward_amount || 0), 0);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const role = req.headers.get("x-user-role");

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [bountiesResult, submissionsResult] = await Promise.all([
    supabaseAdmin
      .from("bounties")
      .select(
        `
          *,
          submissions (
            id,
            status,
            contributor_id,
            content,
            feedback,
            poster_review_status,
            poster_feedback,
            created_at:submitted_at,
            submitted_at,
            reviewed_at,
            paid_at,
            transaction_hash
          )
        `,
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("submissions")
      .select(
        `
          id,
          bounty_id,
          contributor_id,
          content,
          status,
          feedback,
          poster_review_status,
          poster_feedback,
          created_at:submitted_at,
          submitted_at,
          reviewed_at,
          paid_at,
          transaction_hash,
          updated_at,
          bounties (
            id,
            title,
            type,
            custom_type,
            reward_amount,
            total_funding_amount,
            status,
            created_by
          )
        `,
      )
      .order("submitted_at", { ascending: false }),
  ]);

  if (bountiesResult.error) {
    console.error("Admin dashboard bounty query failed:", bountiesResult.error);
    return NextResponse.json({ error: bountiesResult.error.message }, { status: 500 });
  }

  if (submissionsResult.error) {
    console.error("Admin dashboard submission query failed:", submissionsResult.error);
    return NextResponse.json({ error: submissionsResult.error.message }, { status: 500 });
  }

  const bounties = bountiesResult.data || [];
  const submissions = submissionsResult.data || [];
  const awaitingBounties = bounties.filter((bounty) => bounty.status === BOUNTY_STATUS.AwaitingAdminReview);
  const pendingEscrowBounties = bounties.filter((bounty) => bounty.status === BOUNTY_STATUS.PendingEscrow);
  const nonLiveBounties = bounties.filter((bounty) =>
    ![BOUNTY_STATUS.Open, BOUNTY_STATUS.Completed].includes(bounty.status),
  );
  const openBounties = bounties.filter((bounty) => bounty.status === BOUNTY_STATUS.Open);
  const approvedSubmissions = submissions.filter((submission) => submission.status === SUBMISSION_STATUS.Approved);
  const pendingSubmissions = submissions.filter((submission) => submission.status === SUBMISSION_STATUS.Pending);

  return NextResponse.json({
    role: "admin",
    metrics: {
      open_bounties: openBounties.length,
      not_live_bounties: nonLiveBounties.length,
      awaiting_bounty_reviews: awaitingBounties.length,
      pending_escrow_bounties: pendingEscrowBounties.length,
      pending_submissions: pendingSubmissions.length,
      approved_payouts: approvedSubmissions.length,
      queued_payout_ada: sumAda(
        approvedSubmissions.map((submission) => {
          const bounty = Array.isArray(submission.bounties) ? submission.bounties[0] : submission.bounties;
          return { reward_amount: bounty?.reward_amount };
        }),
      ),
    },
    queues: {
      bounty_reviews: awaitingBounties,
      non_live_bounties: nonLiveBounties,
      pending_submissions: pendingSubmissions,
      approved_payouts: approvedSubmissions,
      refund_candidates: bounties.filter((bounty) =>
        [BOUNTY_STATUS.Rejected, BOUNTY_STATUS.Cancelled, BOUNTY_STATUS.Expired].includes(bounty.status),
      ),
    },
    recent_activity: [...bounties].slice(0, 8),
  });
}
