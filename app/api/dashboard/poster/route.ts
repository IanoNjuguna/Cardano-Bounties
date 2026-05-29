import { NextRequest, NextResponse } from "next/server";
import { BOUNTY_STATUS, SUBMISSION_STATUS } from "@/lib/bountyContract";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
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
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Poster dashboard query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bounties = data || [];
  const submissions = bounties.flatMap((bounty) =>
    (bounty.submissions || []).map((submission: Record<string, unknown>) => ({
      ...submission,
      bounty,
    })),
  );

  const pendingPosterReviews = submissions.filter(
    (submission) =>
      submission.status === SUBMISSION_STATUS.Pending &&
      (!submission.poster_review_status || submission.poster_review_status === "pending"),
  );

  return NextResponse.json({
    role: "poster",
    metrics: {
      total_bounties: bounties.length,
      open_bounties: bounties.filter((bounty) => bounty.status === BOUNTY_STATUS.Open).length,
      awaiting_admin_review: bounties.filter((bounty) => bounty.status === BOUNTY_STATUS.AwaitingAdminReview).length,
      pending_submission_reviews: pendingPosterReviews.length,
      committed_ada: bounties.reduce((sum, bounty) => sum + Number(bounty.total_funding_amount || bounty.reward_amount || 0), 0),
    },
    queues: {
      bounties,
      pending_submission_reviews: pendingPosterReviews,
      submissions,
    },
    recent_activity: bounties.slice(0, 8),
  });
}
