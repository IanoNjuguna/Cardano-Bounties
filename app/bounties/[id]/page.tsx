import { BountyDetailsPage } from "@/app/pages/BountyDetailsPage";

export default async function BountyDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <BountyDetailsPage bountyId={id} />;
}
