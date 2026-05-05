import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Generate a random nonce for the wallet to sign
export async function GET(req: NextRequest) {
    const address = req.nextUrl.searchParams.get('address')

    if (!address) {
        return NextResponse.json({ error: 'address is required' }, { status: 400 })
    }

    // Generate a random nonce
    const nonce = crypto.randomUUID()

    // Store nonce against the wallet address
    const {error} = await supabaseAdmin.from('users').upsert(
        {wallet_address: address, nonce, nonce_expires_at: new Date(Date.now() + 5 * 1000).toISOString()},
        {onConflict: 'wallet_address'}
    )

    if (error) {
        return NextResponse.json({error: error.message}, {status: 500})
    }

    return NextResponse.json({nonce})
}