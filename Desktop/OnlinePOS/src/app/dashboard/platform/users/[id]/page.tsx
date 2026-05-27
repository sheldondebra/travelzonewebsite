import { PlatformUserDetail } from "@/components/platform/platform-user-detail";

type Props = { params: Promise<{ id: string }> };

export default async function PlatformUserDetailPage({ params }: Props) {
  const { id } = await params;
  return <PlatformUserDetail userId={id} />;
}
