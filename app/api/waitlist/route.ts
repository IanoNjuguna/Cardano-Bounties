import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/waitlist -- add email to waitlist
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { email } = body

    if (!email) {
        return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'invalid email address' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email })

    if (error) {
        // Duplicate email
        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'email already on waitlist'},
                { status: 409 }
            )
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Successfully joined waitlist'}, { status: 201 })
}

// GET /api/waitlist -- get waitlist count
export async function GET() {
    const { count, error } = await supabaseAdmin
        .from('waitlist')
        .select('*', { count: 'exact', head: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
}