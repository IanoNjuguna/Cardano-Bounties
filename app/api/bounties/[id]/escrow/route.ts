import { NextRequest, NextResponse } from "next/server";
import { verifyEscrowPayment } from "@/lib/blockfrost";
import { adaToLovelace } from "@/lib/cardano/amounts";
import { BOUNTY_STATUS, validateEscrowPayload } from "@/lib/bountyContract";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const configuredEscrowAddress =
    process.env.ESCROW_ADDRESS || process.env.NEXT_PUBLIC_ESCROW_ADDRESS;

  if (!configuredEscrowAddress) {
    return NextResponse.json(
      { error: "Escrow address is not configured" },
      { status: 500 },
    );
  }

  const validated = validateEscrowPayload(body, configuredEscrowAddress);

  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error, field: validated.field },
      { status: 400 },
    );
  }

  const { escrow_tx_hash, escrow_address } = validated.value;

  const { data: bounty, error: fetchError } = await supabaseAdmin
    .from("bounties")
    .select("id, status, created_by, total_funding_amount")
    .eq("id", id)
    .single();

  if (fetchError || !bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  if (bounty.created_by !== userId) {
    return NextResponse.json(
      { error: "You can only escrow your own bounties" },
      { status: 403 },
    );
  }

  if (bounty.status !== BOUNTY_STATUS.PendingEscrow) {
    return NextResponse.json(
      { error: "Bounty is not in pending_escrow status" },
      { status: 400 },
    );
  }

  const expectedLovelace = adaToLovelace(Number(bounty.total_funding_amount));
  const verification = await verifyEscrowPayment({
    txHash: escrow_tx_hash,
    escrowAddress: escrow_address,
    expectedLovelace,
  });

  if (!verification.ok) {
    if (verification.status === 425) {
      await supabaseAdmin
        .from("bounties")
        .update({
          escrow_tx_hash,
          escrow_address,
          escrow_submitted_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return NextResponse.json(
      {
        error: verification.error,
        retryable: verification.status === 425,
        escrow_tx_hash,
      },
      { status: verification.status || 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("bounties")
    .update({
      escrow_tx_hash,
      escrow_address,
      escrow_submitted_at: new Date().toISOString(),
      escrow_confirmed_at: new Date().toISOString(),
      status: BOUNTY_STATUS.AwaitingAdminReview,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
