import { NextRequest, NextResponse } from "next/server";
import { BOUNTY_STATUS, SUBMISSION_STATUS } from "@/lib/bountyContract";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const role = req.headers.get("x-user-role");

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const submissionId = typeof body.submission_id === "string" ? body.submission_id.trim() : "";
  const payoutTxHash = typeof body.transaction_hash === "string" ? body.transaction_hash.trim() : "";

  if (!submissionId) {
    return NextResponse.json({ error: "submission_id is required" }, { status: 400 });
  }

  if (!/^[0-9a-f]{64}$/i.test(payoutTxHash)) {
    return NextResponse.json(
      { error: "transaction_hash must be a 64 character hex transaction id" },
      { status: 400 },
    );
  }

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from("submissions")
    .select("id, status, bounty_id")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.status !== SUBMISSION_STATUS.Approved) {
    return NextResponse.json(
      { error: "Submission must be approved before payment release is recorded" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("submissions")
    .update({
      status: SUBMISSION_STATUS.Paid,
      paid_at: now,
      transaction_hash: payoutTxHash,
      updated_at: now,
    })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin
    .from("submissions")
    .update({ status: SUBMISSION_STATUS.Closed, updated_at: now })
    .eq("bounty_id", submission.bounty_id)
    .neq("id", submissionId)
    .eq("status", SUBMISSION_STATUS.Pending);

  await supabaseAdmin
    .from("bounties")
    .update({
      status: BOUNTY_STATUS.Completed,
      payout_tx_hash: payoutTxHash,
      updated_at: now,
    })
    .eq("id", submission.bounty_id);

  return NextResponse.json(data);
}
