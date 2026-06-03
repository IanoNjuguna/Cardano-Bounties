import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
            { error: 'Only JPEG, PNG, WebP and SVG are allowed' },
            { status: 400 }
        )
    }

    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
            { error: 'File size must be under 2MB' },
            { status: 400 }
        )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    const { error } = await supabaseAdmin.storage
    .from('project-logos')
    .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
    .from('project-logos')
    .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl }, {status: 201})
}