import Link from "next/link";

export function AdminSectionView({
  title,
  description,
  items,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  items?: string[];
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#002B7F]">{title}</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">{description}</p>
      </div>
      <div className="ed-card p-6">
        {items && items.length > 0 ? (
          <ul className="space-y-2 text-[14px] text-[#374151]">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF]" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-[#6B7280]">This section is ready for configuration.</p>
        )}
        {actionHref && actionLabel && (
          <Link href={actionHref} className="ed-btn-primary mt-5 inline-flex text-[13px]">
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
