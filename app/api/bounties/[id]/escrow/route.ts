import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/bounties/[id]/escrow -- save transaction hash after poster locks ADA
export async function POST(req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params
    const userId = req.headers.get('x-user-id')

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { escrow_tx_hash, escrow_address } = body

    if (!escrow_tx_hash || !escrow_address) {
        return NextResponse.json(
            { error: 'escrow_hash and escrow_address are required' },
            { status: 400 }
        )
    }

    // Check bounty exists and belong to this user
    const { data: bounty, error: fetchError } = await supabaseAdmin
    .from('bounties')
    .select('id, status, created_by')
    .eq('id', id)
    .single()

    if (fetchError || !bounty ) {
        return NextResponse.json({ error: 'Bounty not found' }, {status: 404 })
    }

    if (bounty.created_by !== userId) {
        return NextResponse.json(
            { error: 'You can only escrow your own bounties '},
            { status: 403 }
        )
    }

    if (bounty.status !== 'pending_escrow') {
        return NextResponse.json(
            { error: 'Bounty is not in pending_escrow status' },
            { status: 400 }
        )
    }

    // Save transaction hash and move to awaiting_admin_review
    const { data, error } = await supabaseAdmin
    .from('bounties')
    .update({
        escrow_address,
        escrow_tx_hash,
        escrow_submitted_at: new Date().toISOString(),
        status: 'awaiting_admin_review',
        updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
}