import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// PATCH
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const body = await req.json()
    const { status, feedback } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
        return NextResponse.json(
            { error: 'status must be approved or rejected' },
            { status: 400 }
        )
    }

    const { data, error } = await supabaseAdmin
    .from('submissions')
    .update({
        status,
        feedback,
        reviewed_at: new Date().toISOString()
    }).eq('id', id).select().single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 400 })
    }

    return NextResponse.json(data)
}