import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { BOUNTY_STATUS, SUBMISSION_STATUS } from "@/lib/bountyContract";

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
    const { transaction_hash } = body
    const payoutTxHash = typeof transaction_hash === 'string' ? transaction_hash.trim() : ''

    if (!/^[0-9a-f]{64}$/i.test(payoutTxHash)) {
        return NextResponse.json(
            { error: 'transaction_hash must be a 64 character hex transaction id' },
            { status: 400 }
        )
    }

    // Check if submission exists and is approved
    const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, status, bounty_id')
    .eq('id', id)
    .single()

    if (fetchError || !submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== SUBMISSION_STATUS.Approved) {
        return NextResponse.json(
            { error: 'Submission must be approved before marking as paid' },
            { status: 400 }
        )
    }

    const { data, error } = await supabaseAdmin
    .from('submissions')
    .update({
        status: SUBMISSION_STATUS.Paid,
        paid_at: new Date().toISOString(),
        transaction_hash: payoutTxHash,
        updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin
    .from('submissions')
    .update({ status: SUBMISSION_STATUS.Closed, updated_at: new Date().toISOString() })
    .eq('bounty_id', submission.bounty_id)
    .neq('id', id)
    .eq('status', SUBMISSION_STATUS.Pending)

    await supabaseAdmin
    .from('bounties')
    .update({
        status: BOUNTY_STATUS.Completed,
        payout_tx_hash: payoutTxHash,
        updated_at: new Date().toISOString()
    })
    .eq('id', submission.bounty_id)

    return NextResponse.json(data)
}
