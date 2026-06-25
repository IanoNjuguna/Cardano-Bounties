import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateNonce } from "@meshsdk/core";

// Generate a random nonce for the wallet to sign
export async function GET(req: NextRequest): Promise<NextResponse> {
    console.log('[API] GET /api/auth/nonce called for address:', req.nextUrl.searchParams.get('address'))
    const address = req.nextUrl.searchParams.get('address')

    if (!address) {
        console.log('[API] Missing address')
        return NextResponse.json({ error: 'address is required' }, { status: 400 })
    }

    try {
        const nonce = generateNonce('Sign in to Cardano Bounties: ')
        const nonce_expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        console.log('[API] Generated nonce:', nonce)

        console.log('[API] Fetching existing user from Supabase...')
        const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stake_address', address)
        .single()

        console.log('[API] existingUser:', existingUser, 'fetchError:', fetchError)

        if (existingUser) {
            console.log('[API] User exists. Updating nonce...')
            const { error } = await supabaseAdmin
            .from('users')
            .update({ nonce, nonce_expires_at })
            .eq('stake_address', address)

            console.log('[API] Update error:', error)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        } else {
            console.log('[API] User does not exist. Inserting new user...')
            const { error } = await supabaseAdmin
            .from('users')
            .insert({ stake_address: address, nonce, nonce_expires_at, role: 'user' })

            console.log('[API] Insert error:', error)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        }

        console.log('[API] Nonce process completed. Returning response...')
        return NextResponse.json({nonce})
    } catch (e) {
        console.error('[API] Uncaught exception in GET /api/auth/nonce:', e)
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown server error' }, { status: 500 })
    }
}
