import { NextRequest, NextResponse } from "next/server";
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
    const { title, description, type, reward_amount, deadline, project_id } = body

    // Validation
    if (!title || !description || !type) {
        return NextResponse.json(
            { error: 'title, description and type are required' },
            {status: 400 }
        )
    }

    if (!reward_amount || reward_amount <= 0) {
        return NextResponse.json(
            { error: 'reward_amount is required and musr be greater than 0'},
            { status: 400 }
        )
    }

    const {data, error} = await supabaseAdmin
    .from('bounties')
    .insert({title,
        description,
        type,
        reward_amount,
        deadline,
        project_id,
        created_by: userId,
        status: 'pending_escrow'
    })
    .select()
    .single()

    if (error) {
        return NextResponse.json({error: error.message}, {status: 500})
    }

    return NextResponse.json(data, { status: 201 })
    
}