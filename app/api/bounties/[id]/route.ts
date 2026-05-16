import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("bounties")
    .select(
      `
        *,
        submissions (
          id,
          contributor_id,
          status,
          submitted_at,
          reviewed_at
        )
      `,
    )
    .eq("id", id)
    .eq("status", "open")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
