import { WrappedScreen } from "@/components/analytics/WrappedScreen";

interface Props {
  params: Promise<{ year: string }>;
}

export default async function WrappedPage({ params }: Props) {
  const { year } = await params;
  return <WrappedScreen year={parseInt(year)} />;
}
