import { NextRequest, NextResponse } from "next/server";
import { BOUNTY_STATUS, validateCreateBountyPayload } from "@/lib/bountyContract";
import { supabaseAdmin } from "@/lib/supabase";

// Get /api/bounties
export async function GET(): Promise<NextResponse> {
    const { data, error } = await supabaseAdmin
    .from('bounties')
    .select('*')
    .eq('status', 'open')
    .order('created_at', {ascending: false})

    if (error) {
        return NextResponse.json({ error: error.message }, {status: 500 })
    }

    return NextResponse.json(data)
}

export async function  POST(req:NextRequest): Promise<NextResponse> {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = validateCreateBountyPayload(body)

    if (!validated.ok) {
        return NextResponse.json(
            { error: validated.error, field: validated.field },
            { status: 400 }
        )
    }

    const {
        title,
        description,
        type,
        reward_amount,
        platform_fee_amount,
        total_funding_amount,
        deadline,
        project_id,
    } = validated.value

    const {data, error} = await supabaseAdmin
    .from('bounties')
    .insert({title,
        description,
        type,
        reward_amount,
        platform_fee_amount,
        total_funding_amount,
        deadline,
        project_id,
        created_by: userId,
        status: BOUNTY_STATUS.PendingEscrow
    })
    .select()
    .single()

    if (error) {
        return NextResponse.json({error: error.message}, {status: 500})
    }

    return NextResponse.json(data, { status: 201 })
    
}
