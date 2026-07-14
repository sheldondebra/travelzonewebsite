type Props = {
  status: string;
};

const styles: Record<string, string> = {
  published: "bg-[#edfaef] text-[#007017]",
  draft: "bg-[#f0f0f1] text-[#646970]",
  pending: "bg-[#fcf9e8] text-[#996800]",
  confirmed: "bg-[#edfaef] text-[#007017]",
  cancelled: "bg-[#fcf0f1] text-[#d63638]",
  completed: "bg-[#edfaef] text-[#007017]",
  read: "bg-[#edfaef] text-[#007017]",
  archived: "bg-[#f0f0f1] text-[#646970]",
  paid: "bg-[#edfaef] text-[#007017]",
  unpaid: "bg-[#f0f0f1] text-[#646970]",
  failed: "bg-[#fcf0f1] text-[#d63638]",
};

export function StatusBadge({ status }: Props) {
  const style = styles[status] ?? "bg-[#f0f0f1] text-[#646970]";
  return (
    <span
      className={`inline-flex rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold capitalize ${style}`}
    >
      {status}
    </span>
  );
}
