import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, stake_address, role, display_name, bio, created_at')
    .eq('id', userId)
    .single()

    if (error || !data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(data)
}


export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { display_name, bio } = body

    if (!display_name && !bio) {
        return NextResponse.json(
            { error: 'At least one field (display_name or bio) is required' },
            { status: 400 }
        )
    }

    const updates: Record<string, string> = {}

    if (display_name) updates.display_name = display_name
    if (bio) updates.bio = bio

    const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, stake_address, role, display_name, bio, created_at')
    .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}