import { NextRequest, NextResponse } from "next/server";
import { SUBMISSION_STATUS } from "@/lib/bountyContract";
import { supabaseAdmin } from "@/lib/supabase";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
    .from('submissions')
    .select(`
        *,
        bounties (id, title, reward_amount ),
        users ( id, stake_address, display_name )
        `)
        .eq('id', id)
        .single()

        if (error || !data) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
        }

        // Contributors can only view their own submissions
        // Admins can view any submission
        if (userRole !== 'admin' && data.Contributor_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json(data)
}

// PATCH
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const role = req.headers.get('x-user-role')

    if (role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, feedback } = body

    if (!status || ![SUBMISSION_STATUS.Approved, SUBMISSION_STATUS.Rejected].includes(status)) {
        return NextResponse.json(
            { error: 'status must be approved or rejected' },
            { status: 400 }
        )
    }

    const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, status')
    .eq('id', id)
    .single()

    if (fetchError || !submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== SUBMISSION_STATUS.Pending) {
        return NextResponse.json(
            { error: 'Only pending submissions can be reviewed' },
            { status: 400 }
        )
    }

    const { data, error } = await supabaseAdmin
    .from('submissions')
    .update({
        status,
        feedback: typeof feedback === 'string' ? feedback.trim() || null : null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).eq('id', id).select().single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 400 })
    }

    return NextResponse.json(data)
}
