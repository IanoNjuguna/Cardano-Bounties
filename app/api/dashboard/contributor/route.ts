import { SUBMISSION_STATUS } from "@/lib/bountyContract";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: submissions, error } = await supabaseAdmin
    .from('submissions')
    .select(`
        *,
        bounties (
        id,
        title,
        reward_amount,
        type,
        status,
        deadline,
        project_name,
        project_logo_url
        )
        `)
        .eq('contributor_id', userId)
        .order('submitted_at', { ascending: false })

    if (error) {
        console.error('Contributor dashboard query failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const allSubmissions = submissions || []

    const pending = allSubmissions.filter(s => s.status === SUBMISSION_STATUS.Pending)
    const approved = allSubmissions.filter(s => s.status === SUBMISSION_STATUS.Approved)
    const rejected = allSubmissions.filter(s => s.status === SUBMISSION_STATUS.Rejected)
    const paid = allSubmissions.filter(s => s.status === SUBMISSION_STATUS.Paid)

    const totalEarned = paid.reduce((sum, s) => {
        return sum + Number(s.bounties?.reward_amount || 0)
    }, 0)

    return NextResponse.json({
        role: 'contributor',
        metrics: {
            total_submissions: allSubmissions.length,
            pending_submissions: pending.length,
            approved_submissions: approved.length,
            rejected_submissions: rejected.length,
            paid_submissions: paid.length,
            total_earned_ada: totalEarned
        },
        submissions: allSubmissions
    })


}