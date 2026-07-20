"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { PracticeTestView } from "@/components/edamad/practice-test-view";
import { fetchPracticeTest } from "@/services/practice";

export default function PracticeTestPage({
  params,
}: {
  params: Promise<{ subject: string; testSlug: string }>;
}) {
  const { subject, testSlug } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["practice-test", testSlug],
    queryFn: () => fetchPracticeTest(testSlug),
  });

  if (isLoading) return <p className="text-center text-[#6B7280]">Loading test...</p>;
  if (isError || !data) return <p className="text-center text-[#EF4444]">Could not load practice test.</p>;

  return <PracticeTestView data={data} subjectSlug={subject} />;
}
