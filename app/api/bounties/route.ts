import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Get /api/bounties
export async function GET() {
    const { data, error } = await supabaseAdmin.from('bounties').select('*').eq('status', 'open').order('created_at', {ascending: false})

    if (error) {
        return NextResponse.json({ error: error.message }, {status: 500 })
    }

    return NextResponse.json(data)
}

export async function  POST(req:NextRequest) {
    const body = await req.json()
    const { title, description, type, reward_amount, deadline, created_by } = body

    // Validation
    if (!title || !description || !type) {
        return NextResponse.json(
            { error: 'title, description and type are required' },
            {status: 400 }
        )
    }

    const {data, error} = await supabaseAdmin.from('bounties').insert({title, description, type, reward_amount, deadline, created_by}).select().single()

    if (error) {
        return NextResponse.json({error: error.message}, {status: 500})
    }

    return NextResponse.json(data, { status: 201 })
    
}