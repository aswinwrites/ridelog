import { RideDetailScreen } from "@/components/rides/RideDetailScreen";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RideDetailPage({ params }: Props) {
  const { id } = await params;
  return <RideDetailScreen rideId={id} />;
}
