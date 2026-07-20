"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { use } from "react";
import { TestSummaryView } from "@/components/edamad/test-summary-view";
import { fetchLatestTestResult, fetchPracticeTest } from "@/services/practice";
import { usePracticeAttemptStore } from "@/store/practice-attempt-store";

export default function TestSummaryPage({
  params,
}: {
  params: Promise<{ subject: string; testSlug: string }>;
}) {
  const { subject, testSlug } = use(params);
  const { result, setResult } = usePracticeAttemptStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["practice-test", testSlug],
    queryFn: () => fetchPracticeTest(testSlug),
  });

  const needsResult = !result || result.test.slug !== testSlug;

  const { data: latestResult, isLoading: loadingResult } = useQuery({
    queryKey: ["practice-latest-result", testSlug],
    queryFn: () => fetchLatestTestResult(testSlug),
    enabled: needsResult,
    retry: false,
  });

  useEffect(() => {
    if (latestResult) setResult(latestResult);
  }, [latestResult, setResult]);

  if (isLoading || (needsResult && loadingResult)) {
    return <p className="text-center text-[#6B7280]">Loading summary...</p>;
  }

  if (isError || !data) {
    return <p className="text-center text-[#EF4444]">Could not load test summary.</p>;
  }

  return <TestSummaryView data={data} subjectSlug={subject} />;
}
