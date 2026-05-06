import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/auth/verify
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, signature } = body;

  if (!address || !signature) {
    return NextResponse.json(
      { error: "address and signature are required" },
      { status: 400 },
    );
  }
  // Fetch the nonce we stored for this address
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, nonce, nonce_expires_at, role")
    .eq("wallet_address", address)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  // Check nonce hasn't expired yet
  if (new Date(user.nonce_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Nonce expired, please try again" },
      { status: 401 },
    );
  }

  // Verify the signature using MeshJS
  // const isValid = checkSignature(user.nonce, signature);

  if (!signature || !signature.key) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Clear the nonce so it can't be reused
  await supabaseAdmin
    .from("users")
    .update({ nonce: null, nonce_expires_at: null })
    .eq("wallet_address", address);

  //   Issue a JWT valid for 7 days
  const token = jwt.sign(
    { userId: user.id, address, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  return NextResponse.json({ token });
}
