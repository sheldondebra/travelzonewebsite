export function QuestionNavigator({
  total,
  current,
  answeredNumbers,
  reviewResults,
  mode = "test",
  onSelect,
}: {
  total: number;
  current: number;
  answeredNumbers?: number[];
  reviewResults?: Record<number, "correct" | "incorrect">;
  mode?: "test" | "review";
  onSelect?: (num: number) => void;
}) {
  const answered = new Set(answeredNumbers ?? []);

  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          let cls = "border border-[#E5EAF2] bg-white text-[#374151] hover:border-[#0057FF]/50";

          if (mode === "review" && reviewResults) {
            if (n === current) cls = "bg-[#0057FF] text-white border-[#0057FF]";
            else if (reviewResults[n] === "correct") cls = "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]";
            else if (reviewResults[n] === "incorrect") cls = "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]";
            else cls = "border border-[#E5EAF2] bg-white text-[#374151]";
          } else {
            if (n === current) cls = "bg-[#0057FF] text-white border-[#0057FF]";
            else if (answered.has(n)) cls = "bg-[#EBF2FF] text-[#0057FF] border-[#BFDBFE]";
          }

          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect?.(n - 1)}
              className={`flex h-8 items-center justify-center rounded-[6px] text-[11px] font-medium transition-colors ${cls}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[#6B7280]">
        {mode === "review" ? (
          <>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#0057FF]" /> Current</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#DCFCE7]" /> Correct</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#FEE2E2]" /> Incorrect</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#0057FF]" /> Current</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-[#EBF2FF]" /> Answered</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-[#E5EAF2] bg-white" /> Unanswered</span>
          </>
        )}
      </div>
    </div>
  );
}
