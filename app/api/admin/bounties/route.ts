import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { BOUNTY_STATUS } from "@/lib/bountyContract";
// GET /api/admin/bounties -- fetch all bounties

export async function GET(req: NextRequest) {
  const role = req.headers.get("x-user-role");

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/admin/bounties -- cancel a bounty
export async function DELETE(req: NextRequest) {
  const role = req.headers.get("x-user-role");

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("bounties")
    .update({ status: BOUNTY_STATUS.Cancelled, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
