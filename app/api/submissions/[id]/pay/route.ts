import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

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

    // Check if submission exists and is approved
    const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, status')
    .eq('id', id)
    .single()

    if (fetchError || !submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'approved') {
        return NextResponse.json(
            { error: 'Submission must be approved before marking as paid' },
            { status: 400 }
        )
    }

    const { data, error } = await supabaseAdmin
    .from('submissions')
    .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        transaction_hash: transaction_hash || null
    })
    .eq('id', id)
    .select()
    .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}