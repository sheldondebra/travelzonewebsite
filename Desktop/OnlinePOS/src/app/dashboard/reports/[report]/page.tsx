import { notFound } from "next/navigation";
import { ReportDetailView } from "@/components/reports/report-detail-view";
import { isReportId } from "@/components/reports/report-definitions";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ report: string }>;
}) {
  const { report } = await params;

  if (!isReportId(report)) {
    notFound();
  }

  return <ReportDetailView reportId={report} />;
}
