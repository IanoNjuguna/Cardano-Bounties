import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data: cached } = await supabaseAdmin
    .from('metrics')
    .select('*')
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    const age = Date.now() - new Date(cached.cached_at).getTime();
    const oneHour = 60 * 60 * 1000;
    if (age < oneHour) {
      return NextResponse.json(cached);
    }
  }

  const [users, projects, paidSubmissions, completedBounties] =
    await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("projects")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("submissions")
        .select("bounty_id, bounties(reward_amount)")
        .eq("status", "paid"),
      supabaseAdmin
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
    ]);

    type paidSubmission = {
      bounty_id: string
      bounties: { reward_amount:number } [] | null
    }

  const totalAdaDistributed =
    paidSubmissions.data?.reduce((sum, s: paidSubmission) => {
      const reward = s.bounties?.[0].reward_amount || 0
      return sum + reward
    }, 0) || 0

  const metrics = {
    total_users: users.count || 0,
    total_projects: projects.count || 0,
    total_ada_distributed: totalAdaDistributed,
    totalBounties_completed: completedBounties.count || 0,
    updated_at: new Date().toISOString(),
  };

  // Upsert cache
  if (cached) {
    await supabaseAdmin.from("metrics").update(metrics).eq("id", cached.id);
  } else {
    await supabaseAdmin.from("metrics").insert(metrics);
  }

  return NextResponse.json(metrics);
}
