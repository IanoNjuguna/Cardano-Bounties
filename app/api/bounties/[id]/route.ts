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


// PATCH /api/admin/bounties/[id] -- approve or reject a bounty
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const role = req.headers.get('x-user-role')

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { status, feedback } = body
  
  if (!status || !['open', 'cancelled'].includes(status)) {
    return NextResponse.json(
      {error: 'status must be open (approve) or cancelled (reject)' },
      { status: 400 }
    )
  }
  
  // Check bounty is awaiting review
  const { data: bounty, error: fetchError } = await supabaseAdmin
  .from('bounties')
  .select('id, status')
  .eq('id', id)
  .single()
  
  if (fetchError || !bounty) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
  }

  if (bounty.status !== 'awaiting_admin_review') {
    return NextResponse.json(
      { error: 'Bounty is not awaiting admin review' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
  .from('bounties')
  .update({ status })
  .eq('id', id)
  .select()
  .single()
  
  if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}
return NextResponse.json(data)
}