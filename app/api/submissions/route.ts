import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST
export async function POST(req: NextRequest) {

    const contributorId = req.headers.get('x-user-id')

    if (!contributorId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bounty_id, content } = body

    if (!bounty_id || !content) {
        return NextResponse.json(
            { error: 'bounty_id and content are required' },
            { status: 400 }
        )
    }

    const { data: bounty, error: bountyError } = await supabaseAdmin
        .from('bounties')
        .select('id, status')
        .eq('id', bounty_id)
        .single()

    if (bountyError || !bounty) {
        return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    if (bounty.status !== 'open') {
        return NextResponse.json({ error: 'Bounty is no longer open' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('submissions')
        .insert({ bounty_id, contributor_id: contributorId, content })  // ← fixed
        .select()
        .single()

    if (error) {
        if (error?.code === '23505') {
            return NextResponse.json(
                { error: 'you have already submitted to this bounty' },
                { status: 409 }
            )
        }
        return NextResponse.json({ error: error?.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
