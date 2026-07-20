"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { use } from "react";
import { PracticeTestView } from "@/components/edamad/practice-test-view";
import { fetchLatestTestResult, fetchPracticeTestReview } from "@/services/practice";
import { usePracticeAttemptStore } from "@/store/practice-attempt-store";

export default function TestReviewPage({
  params,
}: {
  params: Promise<{ subject: string; testSlug: string }>;
}) {
  const { subject, testSlug } = use(params);
  const { result, setResult } = usePracticeAttemptStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["practice-test-review", testSlug],
    queryFn: () => fetchPracticeTestReview(testSlug),
    retry: false,
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
    return <p className="text-center text-[#6B7280]">Loading review...</p>;
  }

  if (isError || !data) {
    return <p className="text-center text-[#EF4444]">Could not load test review.</p>;
  }

  const activeResult = result?.test.slug === testSlug ? result : latestResult;

  if (!activeResult) {
    return (
      <div className="text-center">
        <p className="text-[#6B7280]">Complete the test first to review your answers.</p>
        <Link href={`/practice/${subject}/test/${testSlug}`} className="ed-btn-primary mt-4 inline-flex">
          Take Test
        </Link>
      </div>
    );
  }

  return <PracticeTestView data={data} subjectSlug={subject} review />;
}
