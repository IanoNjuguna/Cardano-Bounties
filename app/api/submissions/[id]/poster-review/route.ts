import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const POSTER_REVIEW_STATUSES = ["recommended_approval", "changes_requested", "rejected"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";

  if (!POSTER_REVIEW_STATUSES.includes(status as (typeof POSTER_REVIEW_STATUSES)[number])) {
    return NextResponse.json(
      { error: "status must be recommended_approval, changes_requested, or rejected" },
      { status: 400 },
    );
  }

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from("submissions")
    .select(
      `
        id,
        status,
        bounty_id,
        bounties (
          id,
          created_by
        )
      `,
    )
    .eq("id", id)
    .single();

  const bounty = Array.isArray(submission?.bounties) ? submission?.bounties[0] : submission?.bounties;

  if (fetchError || !submission || !bounty) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (bounty.created_by !== userId) {
    return NextResponse.json(
      { error: "You can only review submissions for your own bounties" },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("submissions")
    .update({
      poster_review_status: status,
      poster_feedback: feedback || null,
      poster_reviewed_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
