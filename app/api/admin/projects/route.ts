import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/projects - list all projects
export async function GET(req: NextRequest) {
    const role = req.headers.get('x-user-role')

    if (role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
    .from('projects')
    .select(`
        *,
        bounties (id, title, status)
        `)
        .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
}

// POST /api/projects - create a project
export async function POST(req: NextRequest) {
    const role = req.headers.get('x-user-role')

    if (role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, website, logo_url } = body

    if (!name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ name, description, website, logo_url })
    .select()
    .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}